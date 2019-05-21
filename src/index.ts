import { ApolloServer, gql } from 'apollo-server';
import DataLoader from 'dataloader';
import fs from 'fs';
import puppeteer from 'puppeteer';

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

    public async text(all: boolean = true) {
        const value = await this.page.evaluate((element: HTMLElement, all) => {
            if (all) {
                return element ? element.innerText : null;
            }
            const txt = [];
            element.childNodes.forEach(node => {
                if (node.nodeType === 3) {
                    const nodeText = node.nodeValue.trim();
                    if (nodeText !== '') {
                        txt.push(nodeText);
                    }
                }
            });

            return txt.join(' ');
        }, this.elementHandle, all);
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

    public async textOf(selector?: string, all: boolean = true) {
        const el = selector ? await this.child(selector) : this;
        return el.text(all);
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
    loaders: {
        page: DataLoader<string, puppeteer.Page>
    };
}

interface QueryResolvers {
    child: (_: any, args: { url: string, selector: string }, ctx: Context) => Promise<Element>;
    children: (_: any, args: { url: string, selector: string }, ctx: Context) => Promise<Element[]>;
}

interface ElementResolvers {
    attrOf: (element: Element, args: { selector?: string, name: string }, ctx: Context) => Promise<string>;
    propOf: (element: Element, args: { selector?: string, name: string }, ctx: Context) => Promise<string>;
    textOf: (element: Element, args: { selector?: string, all?: boolean }, ctx: Context) => Promise<string>;
    countOf: (element: Element, args: { selector?: string, itemSelector: string }, ctx: Context) => Promise<number>;
    child: (element: Element, args: { selector: string }, ctx: Context) => Promise<Element>;
    children: (element: Element, args: { selector: string }, ctx: Context) => Promise<Element[]>;
    link: (element: Element, args: { selector: string, urlType: string, name: string, itemSelector: string }, ctx: Context) => Promise<Element>;
}

interface Resolvers {
    Query: QueryResolvers;
    Element: ElementResolvers;
}

const resolvers: Resolvers = {
    Query: {
        child: async (_, { url, selector }, { loaders }) => {
            const page = await loaders.page.load(url);
            const documentHandle = await page.waitForSelector(selector);
            return new Element(page, documentHandle);
        },
        children: async (_, { url, selector }, { loaders }) => {
            const page = await loaders.page.load(url);
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
        textOf: async (element, { selector, all }) => {
            return element.textOf(selector, all);
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
        link: async (element, { selector, urlType, name, itemSelector }, { loaders }) => {
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

            const page = await loaders.page.load(url);
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

async function createBrowser() {
    return puppeteer.launch({
        headless: false
    })
}

async function createPage(browser: puppeteer.Browser) {
    const page: puppeteer.Page = await browser.newPage();

    // page.on('console', msg => console.log('>>>', msg.text()));

    await page.setRequestInterception(true);

    page.on('request', (req) => {
        if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
            req.abort();
        }
        else {
            req.continue();
        }
    });

    return page;
}

async function main() {
    const typeDefs = gql`${fs.readFileSync(__dirname + '/schema.graphql')}`;
    let browser: puppeteer.Browser;

    const server = new ApolloServer({
        typeDefs,
        resolvers: resolvers as any,
        context: async ({ res }) => {
            const pageCacheMap = new Map<string, Promise<puppeteer.Page>>();

            const loaders = {
                page: new DataLoader<string, puppeteer.Page>(async (urls: string[]) => {
                    browser = browser || await createBrowser();

                    return Promise.all(urls.map(async (url) => {
                        const page = await createPage(browser);
                        await page.goto(url);
                        return page;
                    }));
                }, {
                        batch: false,
                        cacheMap: pageCacheMap
                    }),
            };
            res.on('finish', () => {
                pageCacheMap.forEach((page, key) => {
                    page.then(page => page.close()).then(() => pageCacheMap.delete(key));
                });
            });

            return { loaders };
        }
    });

    const { url } = await server.listen();
    console.log(`🚀  Server ready at ${url}`);
}

main();