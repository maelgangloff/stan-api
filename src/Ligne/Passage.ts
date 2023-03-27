import { Arret } from './Arret'
import { Ligne } from './Ligne'

export interface Passage {
    arret: Partial<Arret> & {osmid: string}
    direction: string
    temps_min: number
    temps_theorique: boolean
}
