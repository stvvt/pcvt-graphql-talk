import { GraphQLField } from "graphql";
import { SchemaDirectiveVisitor } from "graphql-tools";
import Context from "../context";
import Element from "../element";

export default class ChildrenDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field: GraphQLField<Element, Context, { url?: string }>) {
        const { selector } = this.args;

        field.resolve = async function (element, { url }, { loaders }) {
            if (typeof element === 'undefined') {
                const page = await loaders.page.load(url);
                await page.waitForSelector(selector);
                const documentHandles = await page.$$(selector);
                return documentHandles.map(documentHandle => new Element(page, documentHandle));
            }

            return element.children(selector);
        }
    }
}