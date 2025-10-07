import puppeteer from 'puppeteer';

async function scrapeData(urls: string[]) {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const scrapedData = [];

  for (const url of urls) {
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      const data = await page.evaluate(() => {
        const title =
          document.querySelector('h1')?.innerText ||
          document.querySelector('h2')?.innerText;

        const contentArray = Array.from(
          document.querySelector('.post-content')?.children ?? []
        );

        const content = contentArray.map(children => {
          return (children as HTMLElement)?.innerText;
        });

        return { title, content };
      });

      scrapedData.push({ ...data });
      await page.close();
    } catch (error: any) {
      console.error(`Gagal scrape ${url}: ${error.message}`);
      scrapedData.push({
        url,
        title: 'ERROR',
        text: `Gagal akses halaman. (${error.message})`,
      });
    }
  }
  await browser.close();
  console.log(JSON.stringify(scrapedData));
}

scrapeData([
  'https://saintek.uin-suka.ac.id/id/show/berita/12419/jurnal-jiehis-dan-kaunia-terakreditasi-sinta',
  'https://saintek.uin-suka.ac.id/id/show/berita/12418/uin-sunan-kalijaga-undergoes-asiin-accreditation-to-strengthen-global-academic-standards',
  'https://saintek.uin-suka.ac.id/id/show/berita/12189/three-students-from-the-faculty-of-science-and-technology-participate-in-the-asean-student-mobility-programme-2025-in-malaysia',
  'https://saintek.uin-suka.ac.id/id/show/berita/12472/pengukuhan-guru-besar-prof-dr-susy-yunita-prabawati-msi-dalam-bidang-sintesis-material-organik-dan-bahan-alam',
  'https://saintek.uin-suka.ac.id/id/show/berita/12464/akreditasi-prodi-magister-teknik-industri-2025',
  'https://saintek.uin-suka.ac.id/id/show/berita/12523/himbauan-dan-informasi-layanan-masukansaranpengaduan-fst-uin-sunan-kalijaga',
  'https://saintek.uin-suka.ac.id/id/show/berita/12514/pengabdian-kepada-masyarakat-di-desa-watukelir-kecamatan-ayah-kabupaten-kebumen-jawa-tegah',
  'https://saintek.uin-suka.ac.id/id/show/berita/12502/rapat-pendampingan-pengembangan-karir-dosen',
  'https://saintek.uin-suka.ac.id/id/show/berita/12500/rumahku-syurgaku-kisah-prof-maizer-dan-fondasi-cinta-fakultas-sains-dan-teknologi',
  'https://saintek.uin-suka.ac.id/id/show/berita/12573/reviu-kurikulum-program-studi-di-lingkungan-fst-uin-sunan-kalijaga-2024',
]);
