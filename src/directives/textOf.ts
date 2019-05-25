import { GraphQLField } from "graphql";
import { SchemaDirectiveVisitor } from "graphql-tools";
import Context from "../context";
import Element from "../element";

export default class TextOfDirective extends SchemaDirectiveVisitor
{
    visitFieldDefinition(field: GraphQLField<Element, Context>) {
        const { selector, all } = this.args
        field.resolve = function (element) {
            return element.textOf(selector, all);
        }
    }
}