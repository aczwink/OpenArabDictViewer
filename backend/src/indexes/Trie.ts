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

import { Dictionary } from "acts-util-core";

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

    public Find(key: string[]): T[]
    {
        if(key.length === 0)
            return this.values;

        const nextKey = key[0];
        const child = this.children[nextKey];
        if(child === undefined)
            return [];

        const rest = key.slice(1);
        return child.Find(rest);
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

    //State
    private children: Dictionary<TrieNode<T>>;
    private values: T[];
}

export class Trie<T>
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