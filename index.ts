import puppeteer from 'puppeteer';

async function scrapeData(year: number, month: number) {
  const BASE_URL = `https://saintek.uin-suka.ac.id/id/berita/arsip?y=${year}&m=${month}`;
  const browser = await puppeteer.launch({
    headless: true,
  });

  const allValidUrls: (string | null)[] = [];

  try {
    const page = await browser.newPage();
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    while (true) {
      const urlsOnPage = await page.evaluate(() => {
        const anchorTags = Array.from(
          document.querySelectorAll(`.blog-posts a`) ?? []
        );
        const anchorHref = anchorTags.map(children => {
          return (children as HTMLElement)?.getAttribute('href');
        });

        return anchorHref.filter(url => {
          return url && !url.startsWith('#');
        });
      });

      allValidUrls.push(...urlsOnPage);

      const nextButtonParent = await page.$(
        'xpath/.//li[contains(@class, "page-item") and .//a[.//i[contains(@class, "fa-angle-right")]]]'
      );
      const isNextDisabled =
        nextButtonParent &&
        (await page.evaluate(
          el => el.classList.contains('disabled'),
          nextButtonParent
        ));

      if (!isNextDisabled) {
        const nextButton = await page.$(
          'xpath/.//a[contains(@class, "page-link") and .//i[contains(@class, "fa-angle-right")]]'
        );
        if (nextButton) {
          await Promise.all([
            page.waitForNetworkIdle({ idleTime: 500 }),
            nextButton.click(),
          ]);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    await page.close();
  } catch (error: any) {
    console.error(`Gagal scrape: ${error.message}`);
  }
  await browser.close();
  console.log(JSON.stringify({ allValidUrls }, null, 2));
}

scrapeData(2025, 8); // Using a date with known multiple pages for testing
