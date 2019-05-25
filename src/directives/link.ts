import { GraphQLField } from "graphql";
import { SchemaDirectiveVisitor } from "graphql-tools";
import Context from "../context";
import Element from "../element";

export default class LinkDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field: GraphQLField<Element, Context>) {
        const { selector, urlType, name, itemSelector } = this.args;

        field.resolve = async function (element, args, { loaders }) {
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
}