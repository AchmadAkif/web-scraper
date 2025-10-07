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
    await fs.writeFile(outputFilename, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`✅ File JSON berhasil disimpan: ${outputFilename}`);
  } catch (error) {
    console.error('❌ Gagal saat menulis file JSON:', error);
  }
};

const printCSV = async (
  year: number,
  month: number,
  result: resultProperty[]
) => {
  if (result.length === 0) {
    console.log('⚠️ Tidak ada data untuk disimpan ke CSV.');
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
    console.log(`✅ File CSV berhasil disimpan: ${outputFilename}`);
  } catch (error) {
    console.error('❌ Gagal saat menulis file CSV:', error);
  }
};


async function scrapeData(year: number, month: number) {
  const BASE_URL = `https://syariah.uin-suka.ac.id/id/berita/arsip?y=${year}&m=${month}`;
  const browser = await puppeteer.launch({
    headless: true,
  });

  const validUrls: (string | null)[] = [];
  const result: resultProperty[] = [];

  console.log(`Memulai scraping untuk ${month}/${year}...`);
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

      const nextButton = await page.$(
        'li.page-item:not(.disabled) a.page-link i.fa-angle-right'
      );
      
      if (nextButton) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
          nextButton.click(),
        ]);
      } else {
        break;
      }
    }
    await page.close();
    console.log(`Mengumpulkan ${validUrls.length} URL berita.`);

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
    console.error(`❌ Gagal scrape: ${error.message}`);
  }

  await browser.close();
  console.log(`\nProses scraping selesai. Menyimpan hasil...`);
  
  await printJSON(year, month, result);
  await printCSV(year, month, result);

  return;
}

scrapeData(2024, 2);