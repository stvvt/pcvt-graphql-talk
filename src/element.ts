import puppeteer from 'puppeteer';

export default class Element {
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
        let elementHandle;
        for (let i = 0; i < 10; i++) {
            elementHandle = await this.elementHandle.$(selector);
            if (elementHandle) {
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return new Element(this.page, elementHandle);
    }

    public async children(selector: string) {
        let elementHandles;
        for (let i = 0; i < 10; i++) {
            elementHandles = await this.elementHandle.$$(selector);
            if (elementHandles.length > 0) {
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return elementHandles.map(elementHandle => new Element(this.page, elementHandle));
    }

    public async eval(code: string) {
        return this.page.evaluate(`(function () { try { ${code} } catch (ex) { return [ex.toString()]; } })()`);
    }
}