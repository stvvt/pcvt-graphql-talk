import { GraphQLField } from "graphql";
import { SchemaDirectiveVisitor } from "graphql-tools";
import Context from "../context";
import Element from "../element";

export default class AttrOfDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field: GraphQLField<Element, Context>) {
        const { selector, name } = this.args;

        field.resolve = function (element) {
            return element.attrOf(name, selector);
        }
    }
}