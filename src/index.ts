import { ApolloServer, gql } from 'apollo-server';
import fs from 'fs';
import puppeteer, { Browser } from 'puppeteer';

class Element {
    constructor(private page: puppeteer.Page, private elementHandle: puppeteer.ElementHandle) { }

    public async attr(name: string) {
        const value = await this.page.evaluate((element: HTMLElement, name) => {
            return element ? element.getAttribute(name) : null;
        }, this.elementHandle, name);
        return value;
    }

    public async prop(name: string) {
        const value = await this.page.evaluate((element: HTMLElement, name) => {
            return element ? element[name] : null;
        }, this.elementHandle, name);
        return value;
    }

    public async text() {
        const value = await this.page.evaluate((element: HTMLElement) => element ? element.innerText : null, this.elementHandle);
        return value;
    }

    public async attrOf(name: string, selector?: string) {
        const el = selector ? await this.child(selector) : this;
        return el.attr(name);
    }

    public async propOf(name: string, selector?: string) {
        const el = selector ? await this.child(selector) : this;
        return el.prop(name);
    }

    public async textOf(selector?: string) {
        const el = selector ? await this.child(selector) : this;
        return el.text();
    }

    public async countOf(itemSelector: string, selector?: string) {
        const el = selector ? await this.child(selector) : this;
        const elementHandles = await el.elementHandle.$$(itemSelector);

        return elementHandles.length;
    }

    public async child(selector: string) {
        const elementHandle = await this.elementHandle.$(selector);
        return new Element(this.page, elementHandle);
    }

    public async children(selector: string) {
        const elementHandles = await this.elementHandle.$$(selector);
        return elementHandles.map(elementHandle => new Element(this.page, elementHandle));
    }
}

interface Context {
    browser: () => Browser;
}

interface QueryResolvers {
    child: (_: any, args: { url: string, selector: string }, ctx: Context) => Promise<Element>;
    children: (_: any, args: { url: string, selector: string }, ctx: Context) => Promise<Element[]>;
}

interface ElementResolvers {
    attrOf: (element: Element, args: { selector?: string, name: string }, ctx: Context) => Promise<string>;
    propOf: (element: Element, args: { selector?: string, name: string }, ctx: Context) => Promise<string>;
    textOf: (element: Element, args: { selector?: string }, ctx: Context) => Promise<string>;
    countOf: (element: Element, args: { selector?: string, itemSelector: string }, ctx: Context) => Promise<number>;
    child: (element: Element, args: { selector: string }, ctx: Context) => Promise<Element>;
    children: (element: Element, args: { selector: string }, ctx: Context) => Promise<Element[]>;
    link: (element: Element, args: { selector: string, urlType: string, name: string, itemSelector: string }, ctx: Context) => Promise<Element>;
}

interface Resolvers {
    Query: QueryResolvers;
    Element: ElementResolvers;
}

const createdPages: puppeteer.Page[] = []

async function createPage({browser}) {
    const page: puppeteer.Page = await (await browser()).newPage();

    page.on('console', msg => console.log('>>>', msg.text()));

    await page.setRequestInterception(true);

    page.on('request', (req) => {
        if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
            req.abort();
        }
        else {
            req.continue();
        }
    });

    createdPages.push(page);

    return page;
}

const resolvers: Resolvers = {
    Query: {
        child: async (_, { url, selector }, ctx) => {
            const page = await createPage(ctx);
            await page.goto(url);
            const documentHandle = await page.waitForSelector(selector);
            return new Element(page, documentHandle);
        },
        children: async (_, { url, selector }, ctx) => {
            const page = await createPage(ctx);
            await page.goto(url);
            await page.waitForSelector(selector);
            const documentHandles = await page.$$(selector);
            return documentHandles.map(documentHandle => new Element(page, documentHandle));
        },
    },
    Element: {
        attrOf: async (element, { selector, name }) => {
            return element.attrOf(name, selector);
        },
        propOf: async (element, { selector, name }) => {
            return element.propOf(name, selector);
        },
        textOf: async (element, { selector }) => {
            return element.textOf(selector);
        },
        countOf: async (element, { selector, itemSelector }) => {
            return element.countOf(itemSelector, selector);
        },
        child: async (element, { selector }) => {
            return element.child(selector);
        },
        children: async (element, { selector }) => {
            return element.children(selector);
        },
        link: async (element, { selector, urlType, name, itemSelector }, ctx) => {
            let url: string;

            switch (urlType) {
                case 'Attr':
                    url = await element.attrOf(name, selector);
                    break;
                case 'Prop':
                    url = await element.propOf(name, selector);
                    break;
                case 'Text':
                    url = await element.textOf(selector);
                    break;
            }

            const page = await createPage(ctx);

            await page.goto(url);
            const documentHandle = await page.waitForSelector(itemSelector);
            return new Element(page, documentHandle);
        }
    }
};

function getBrowserFactory() {
    let browser: puppeteer.Browser = null;
    return async function getBrowser() {
        if (browser === null) {
            browser = await puppeteer.launch({
                headless: false
            });
        }

        return browser;
    }
}

async function main() {
    const typeDefs = gql`${fs.readFileSync(__dirname + '/schema.graphql')}`;
    const browserFactory = getBrowserFactory();
    const server = new ApolloServer({
        typeDefs,
        resolvers: resolvers as any,
        context: ({ res }) => {
            res.on('finish', () => {
                createdPages.forEach((page, index) => {
                    page.close().then(() => delete createdPages[index]);
                });
            });
            return { browser: browserFactory };
        }
    });

    const { url } = await server.listen();
    console.log(`🚀  Server ready at ${url}`);
}

main();