import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import { Parser } from 'json2csv';

type resultProperty = {
  title: string;
  content: string[];
};

const printJSON = async (
  year: number,
  month: number,
  result: resultProperty[]
) => {
  try {
    const outputFilename = `scraped_data_${year}_${month}.json`;
    await fs.writeFile(
      outputFilename,
      JSON.stringify(result, null, 2),
      'utf-8'
    );
    console.log(`✅ JSON file generated: ${outputFilename}`);
  } catch (error) {
    console.error('❌ Failed to generate JSON file:', error);
  }
};

const printCSV = async (
  year: number,
  month: number,
  result: resultProperty[]
) => {
  if (result.length === 0) {
    console.log('⚠️ No data to write on CSV file.');
    return;
  }
  try {
    const processedData = result.map(item => ({
      title: item.title,
      content: item.content.join('\n').trim(),
    }));

    const parser = new Parser({ fields: ['title', 'content'] });
    const csv = parser.parse(processedData);

    const outputFilename = `scraped_data_${year}_${month}.csv`;
    await fs.writeFile(outputFilename, csv, 'utf-8');
    console.log(`✅ CSV file generated: ${outputFilename}`);
  } catch (error) {
    console.error('❌ Failed to generate CSV file:', error);
  }
};

async function scrapeData(year: number, month: number) {
  const BASE_URL = `https://saintek.uin-suka.ac.id/id/berita/arsip?y=${year}&m=${month}`;
  const browser = await puppeteer.launch({
    headless: true,
  });

  const validUrls: (string | null)[] = [];
  const result: resultProperty[] = [];

  console.log(`Starting scraping for news on ${month}/${year}...`);
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
    console.log(`Collecting ${validUrls.length} URL.`);

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

          const content = contentArray
            .map(children => (children as HTMLElement)?.innerText)
            .filter(text => text && text.trim() !== '');

          return { title: title ? title : 'N/A', content };
        });
        result.push({ ...content });
        await page.close();
      }
    }
  } catch (error: any) {
    console.error(`❌ Failed to scrape: ${error.message}`);
  }

  await browser.close();
  console.log(`\nScraping completed. Saving result...`);

  await printJSON(year, month, result);
  await printCSV(year, month, result);

  return;
}

scrapeData(2025, 8);
