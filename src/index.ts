import 'dotenv/config';
import { createPage } from './services/browser.js';
import { acceptCookies, goToCatalogsPage, scrapeCatalogs } from './services/catalogs.js';

(async () => {
	const { browser, page } = await createPage();
	
	await page.goto(process.env.BASE_URL as string);
	
	await acceptCookies(page);
	await goToCatalogsPage(page);
	await scrapeCatalogs(page);
	
	await browser.close();
})();
