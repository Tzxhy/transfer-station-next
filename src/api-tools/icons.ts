import { api } from "./db"

const ApiDefaultConfig = {
    dataSource: 'Cluster0',
    database: 'transfer',
    collection: 'icons',
}
export const ImageError = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjY0MDYgMTguMjc2OEw5LjI5ODc3IDIwLjY0OTVDMS41NzA1NSAxNy42OTE1IDIuNDQzNzYgMTAuNTIwOCA0LjE4NDUgNy42OTUyNkM0LjE4NDUgNy42OTUyNiA3LjI3NDI4IDEzLjAwMDQgOC45NTc0NSAxNS4wOTc5QzEwLjY0MDYgMTcuMTk1NSAxMy43MTkxIDE2LjQ1MDkgMTQuNTgzIDE1Ljc0NzdMMTEuNTMxMiAyMC45NDM2QzExLjUzMTIgMjAuOTQzNiAxNS4yMjg4IDIxLjYyMTQgMTguNjMzIDE4LjI3NjhDMjEuNTY2NSAxNS4zOTQ0IDIxLjE5NDIgMTEuMjgzNyAyMC41NDk1IDkuNDkzNzdIMTMuMzMzMUMxNC41ODMgMTAuMjE4OCAxNS4wMjY0IDEyLjQwNDUgMTQuMDcxOCAxMy4zMjY5QzEyLjQwMzkgMTQuOTM4NyAxMC42NDA2IDE0LjM3NSA5LjUzMTI1IDEyLjVMNS4xODczNyA1Ljg5MjUzQzcuNzc5MTQgMy4zMjI2OSAxNC40MzI2IDAuMzY2MzIzIDE5LjgxMDkgNy4yNDAwN0wxMi43NjQ4IDcuMjQwMDdDMTEuNTMxMiA3LjI0MDA3IDEwLjM0MzggNy40Njg3NSA5LjI5ODc3IDguMzk0NDgiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K"
export const getIconsByDomains = async (domains: string[]) => {
    return api.find({
        ...ApiDefaultConfig,
        filter: {
            domain: {
                $in: domains,
            },
        },
    }).then(d => {
        return d.documents as Icon[];
    }).catch(e => {
        return [] as Icon[];
    })
}
export const getIconByDomain = async (domain: string) => {
    return api.findOne({
        ...ApiDefaultConfig,
        filter: {
            domain,
        },
    }).then(d => {
        return d.document as Icon;
    }).catch(e => {
        return null;
    })
}
export const setIconByDomain = async (domain: string, img: string) => {
    return api.updateOne({
        ...ApiDefaultConfig,
        filter: {
            domain,
        },
        update: {
            domain,
            image: img,
        } as Icon,
        upsert: true,
    }).then(d => {
        return d.upsertedId;
    }).catch(e => {
        return ''
    })
}