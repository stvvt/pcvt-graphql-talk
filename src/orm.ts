type Row = any;

interface DataType {
    [model: string]: Row[];
}

export default class Orm<T extends DataType>
{
    models: {
        [model in keyof T]: Repository;
    };

    constructor(data: T) {
        this.models = Object.keys(data).reduce((acc, model) => {
            acc[model] = new Repository(data[model]);
            return acc;
        }, {} as any);
        for(const model in data) {
            this.models[model] = new Repository(data[model]);
        }
    }
}

class Repository {
    constructor(private data: Row[]) {
    }

    all() {
        return this.data;
    }

    filter(prop: string, value) {
        return this.data.filter(row => row[prop] == value);
    }

    find(prop: string, value) {
        return this.data.find(row => row[prop] == value);
    }
}
