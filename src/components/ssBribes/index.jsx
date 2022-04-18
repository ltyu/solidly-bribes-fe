import { useState, useEffect } from 'react'
import classes from './ssBribes.module.css'
import BribeCard from '../ssBribeCard'

import stores from '../../stores'
import { ACTIONS } from '../../stores/constants'
import { EnhancedTableToolbar } from '../../pages/bribe'

export default function Bribes() {
  const [bribes, setBribes] = useState([])
  const [pairs, setPairs] = useState([])
  const [search, setSearch] = useState('')
  const [filteredBribes, setFilteredBribes] = useState([]) // Used for search

  const onSearchChanged = (event) => {
    const searchTerm = event.target.value.toLowerCase()
    setSearch(searchTerm)
    setFilteredBribes(bribes.filter((bribe) => bribe.token.symbol.toLowerCase().includes(searchTerm)))
  }

  useEffect(() => {
    if (!pairs.length) {
      stores.dispatcher.dispatch({ type: ACTIONS.GET_PAIR_INFO })
    }
  }, [pairs.length])

  useEffect(() => {
    const pairInfoUpdated = () => {
      const pairsWithGauges = stores.stableSwapStore.getStore('pairs').filter((pair) => pair.gauge)
      setPairs(pairsWithGauges)
      stores.dispatcher.dispatch({ type: ACTIONS.GET_BRIBES, content: { pairs: pairsWithGauges } })
    }

    const bribeStoreUpdated = () => {
      const bribes = stores.bribeStore.getStore('bribes')
      setBribes([...bribes])
      setFilteredBribes([...bribes])
    }

    stores.emitter.on(ACTIONS.PAIR_INFO_UPDATED, pairInfoUpdated)
    stores.emitter.on(ACTIONS.BRIBES_STORE_UPDATED, bribeStoreUpdated)

    return () => {
      stores.emitter.removeListener(ACTIONS.PAIR_INFO_UPDATED, pairInfoUpdated)
      stores.emitter.removeListener(ACTIONS.BRIBES_STORE_UPDATED, bribeStoreUpdated)
    }
  }, [])

  return (
    <div className={classes.container}>
      <EnhancedTableToolbar search={search} onSearchChanged={onSearchChanged} />
      {filteredBribes.length > 0 && (
        <div className={classes.bribesContainer}>
          {filteredBribes.map((bribe, index) => {
            return <BribeCard key={index} bribe={bribe} />
          })}
        </div>
      )}
    </div>
  )
}
