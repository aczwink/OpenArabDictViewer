/**
 * OpenArabDictViewer
 * Copyright (C) 2025 Amir Czwink (amir130@hotmail.de)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * */

import { Dictionary, Enumerable, EnumeratorBuilder } from "acts-util-core";

class TrieNode<T>
{
    constructor()
    {
        this.children = {};
        this.values = [];
    }

    public Add(key: string[], value: T)
    {
        if(key.length === 0)
            this.values.push(value);
        else
        {
            const next = key[0];
            const child = this.GetChild(next);

            const rest = key.slice(1);
            child.Add(rest, value);
        }
    }

    public Find(key: string[]): EnumeratorBuilder<T>
    {
        if(key.length === 0)
        {
            const generator = this.IterateValuesRecursively();
            return Enumerable.EnumerateIterator(generator);
        }

        const nextKey = key[0];
        const child = this.children[nextKey];
        if(child !== undefined)
        {
            const rest = key.slice(1);
            return child.Find(rest);
        }

        return Enumerable.Empty();
    }

    //Private methods
    private GetChild(nextKey: string)
    {
        const child = this.children[nextKey];
        if(child === undefined)
        {
            const child = new TrieNode<T>;
            this.children[nextKey] = child;
            return child;
        }
        return child;
    }

    private* IterateValuesRecursively(): Generator<T>
    {
        for (const value of this.values)
            yield value;
        for (const key in this.children)
        {
            if (Object.prototype.hasOwnProperty.call(this.children, key))
            {
                const child = this.children[key]!;
                yield* child.IterateValuesRecursively();
            }
        }
    }

    //State
    private children: Dictionary<TrieNode<T>>;
    private values: T[];
}

export class PrefixTree<T>
{
    constructor()
    {
        this.root = new TrieNode;
    }

    public Add(key: string[], value: T)
    {
        this.root.Add(key, value);
    }

    public Find(key: string[])
    {
        return this.root.Find(key);
    }

    //State
    private root: TrieNode<T>;
}