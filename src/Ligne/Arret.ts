import { Direction } from './Direction'
import { Ligne } from './Ligne'

export interface Arret {
    libelle: string
    ligne: Partial<Ligne> & {id: number, numlignepublic: string}
    osmid?: string
    id?: number,
    direction?: Direction
}
