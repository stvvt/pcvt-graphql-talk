import { GraphQLField } from "graphql";
import { SchemaDirectiveVisitor } from "graphql-tools";
import Context from "../context";
import Element from "../element";

export default class ChildDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field: GraphQLField<Element, Context, { url?: string }>) {
        const { selector } = this.args;

        field.resolve = async function (element, { url }, { loaders }) {
            if (typeof element === 'undefined') {
                const page = await loaders.page.load(url);
                const documentHandle = await page.waitForSelector(selector);
                return new Element(page, documentHandle);
            }

            return element.child(selector);
        }
    }
}