import puppeteer, { Browser, Page } from 'puppeteer';
import 'dotenv/config';

export async function createPage(): Promise<{ browser: Browser; page: Page }> {
	const browser = await puppeteer.launch({
		headless: false,
		executablePath: process.env.BROWSER_PATH
	});
	
	const page = await browser.newPage();
	await page.setViewport({ width: 1920, height: 1080 });
	
	return { browser, page };
}
