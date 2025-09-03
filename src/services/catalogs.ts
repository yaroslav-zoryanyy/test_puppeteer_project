import { Page } from 'puppeteer';

export interface Catalog {
	title: string | null;
	pdf: string | null;
	startDate: string | null;
	endDate: string | null;
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
	
	const catalogs: Catalog[] = await page.$$eval('ul.catalogues-grid > li > div', items => {
		return items.map(item => {
			const titleEl = item.querySelector<HTMLAnchorElement>('div > h3 > a');
			const pdfEl = item.querySelector<HTMLAnchorElement>('div.hover > figure > figcaption > a[href*="uploads"]');
			const timeEls = item.querySelectorAll<HTMLTimeElement>('p > time');
			
			const startDate = timeEls[0]?.getAttribute('datetime') || null;
			const endDate = timeEls[1]?.getAttribute('datetime') || null;
			
			return {
				title: titleEl?.textContent?.trim() || null,
				pdf: pdfEl?.href || null,
				startDate,
				endDate
			};
		});
	});
	
	return catalogs;
}
