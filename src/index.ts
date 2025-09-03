import { writeFileSync } from 'node:fs';
import 'dotenv/config';
import { createPage } from './services/browser.js';
import { acceptCookies, goToCatalogsPage, scrapeCatalogs } from './services/catalogs.js';

(async () => {
	const { browser, page } = await createPage();
	
	await page.goto(process.env.BASE_URL as string);
	
	await acceptCookies(page);
	await goToCatalogsPage(page);
	
	const catalogs = await scrapeCatalogs(page);
	
	writeFileSync('src/db/catalogs.json', JSON.stringify(catalogs, null, 2));
	console.log('Збережено catalogs.json');
	
	await browser.close();
})();
