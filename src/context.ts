import DataLoader from 'dataloader';
import puppeteer from 'puppeteer';

export default interface Context {
    loaders: {
        page: DataLoader<string, puppeteer.Page>
    };
}

