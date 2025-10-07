import puppeteer from 'puppeteer';

type resultProperty = {
  title: string;
  content: string[];
};

async function scrapeData(year: number, month: number) {
  const BASE_URL = `https://saintek.uin-suka.ac.id/id/berita/arsip?y=${year}&m=${month}`;
  const browser = await puppeteer.launch({
    headless: true,
  });

  const validUrls: (string | null)[] = [];
  const result: resultProperty[] = [];

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

      validUrls.push(...urlsOnPage);

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

    for (const url of validUrls) {
      if (url) {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const content = await page.evaluate(() => {
          const title =
            document.querySelector('h1')?.innerText ||
            document.querySelector('h2')?.innerText;

          const contentArray = Array.from(
            document.querySelector('.post-content')?.children ?? []
          );

          const content = contentArray.map(children => {
            return (children as HTMLElement)?.innerText;
          });

          return { title: title ? title : 'N/A', content };
        });
        result.push({ ...content });
        await page.close();
      } else {
        throw new Error('Link can not be undefined');
      }
    }
  } catch (error: any) {
    console.error(`Gagal scrape: ${error.message}`);
  }
  await browser.close();
  console.log(JSON.stringify(result));
}

scrapeData(2025, 8);
