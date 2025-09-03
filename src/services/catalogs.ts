import { Page } from 'puppeteer';
import { Catalog } from "../interfaces/catalogs.interface";
import { join } from 'node:path';
import { writeFileSync, existsSync, mkdirSync, createWriteStream } from 'node:fs';

async function downloadPDF(url: string, dest: string): Promise<void> {
	const client = url.startsWith('https')
		? (await import('https')).get
		: (await import('http')).get;
	
	return new Promise((resolve, reject) => {
		client(url, (response: any) => {
			if (response.statusCode !== 200) {
				return reject(new Error(`Не вдалося завантажити '${url}' (${response.statusCode})`));
			}
			const file = createWriteStream(dest);
			response.pipe(file);
			file.on('finish', () => {
				file.close((err) => {
					if (err) reject(err);
					else resolve();
				});
			});
		}).on('error', reject);
	});
}

export async function acceptCookies(page: Page): Promise<void> {
	const cookieButton = await page.$('a[id="cookie-allow-all"]');
	if (cookieButton) await cookieButton.click();
}

export async function goToCatalogsPage(page: Page): Promise<void> {
	const catalogLink = await page.$('ul.menu-primary > li > a[href*="katalogi"]');
	if (catalogLink) {
		await Promise.all([
			page.waitForNavigation({ waitUntil: 'networkidle2' }),
			catalogLink.click()
		]);
	} else {
		console.log("Елемент пошуку не знайдено");
	}
}

export async function scrapeCatalogs(page: Page): Promise<Catalog[]> {
	await page.waitForSelector('ul.catalogues-grid > li');
	
	const jsonDir = 'src/db';
	const pdfDir = join(jsonDir, 'pdf');
	if (!existsSync(jsonDir)) mkdirSync(jsonDir, { recursive: true });
	if (!existsSync(pdfDir)) mkdirSync(pdfDir, { recursive: true });
	
	const catalogs: Catalog[] = await page.$$eval('ul.catalogues-grid > li > div', items => {
		return items.map(item => {
			const titleEl = item.querySelector<HTMLAnchorElement>('div > h3 > a');
			const pdfEl = item.querySelector<HTMLAnchorElement>('div.hover > figure > figcaption > a[href*="uploads"]');
			const timeEls = item.querySelectorAll<HTMLTimeElement>('p > time');
			
			const startDate = timeEls[0]?.getAttribute('datetime') || null;
			const endDate = timeEls[1]?.getAttribute('datetime') || null;
			
			return {
				title: titleEl?.textContent?.trim() || null,
				link: pdfEl?.href || null,
				startDate,
				endDate
			};
		});
	});
	
	for (const catalog of catalogs) {
		if (catalog.link) {
			const fileName = catalog.link.split('/').pop();
			if (fileName) {
				const dest = join(pdfDir, fileName);
				try {
					await downloadPDF(catalog.link, dest);
					console.log(`Завантажено: ${fileName}`);
				} catch (err) {
					console.error(`Помилка завантаження ${fileName}:`, err);
				}
			}
		}
	}
	
	writeFileSync(join(jsonDir, 'catalogs.json'), JSON.stringify(catalogs, null, 2));
	console.log('Збережено src/bd/catalogs.json');
	
	return catalogs;
}
