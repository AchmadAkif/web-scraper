import puppeteer from 'puppeteer';

async function scrapeData(year: number, month: number, page: number = 1) {
  const BASE_URL = `https://saintek.uin-suka.ac.id/id/berita/arsip?y=${year}&m=${month}&page=${page}`;
  const browser = await puppeteer.launch({
    headless: true,
  });

  const scrapedData = [];

  try {
    const page = await browser.newPage();
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const data = await page.evaluate(() => {
      const anchorTags = Array.from(
        document.querySelectorAll(`.blog-posts a`) ?? []
      );
      const anchorHref = anchorTags.map(children => {
        return (children as HTMLElement)?.getAttribute('href');
      });

      const validUrls = anchorHref.filter(url => {
        return url && !url.startsWith('#');
      });

      return { validUrls };
    });

    scrapedData.push({ ...data });
    await page.close();
  } catch (error: any) {
    console.error(`Gagal scrape`);
    scrapedData.push({
      title: 'ERROR',
      text: `Gagal akses halaman. (${error.message})`,
    });
  }
  await browser.close();
  console.log(JSON.stringify(scrapedData));
}

scrapeData(2024, 7, 2);
