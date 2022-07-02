import { Ligne } from './Ligne'

export interface Direction {
    ligne: Partial<Ligne> & {id: number, numlignepublic: string}
    id: number
    direction: string
    libelle: string
}
