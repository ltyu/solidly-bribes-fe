import Vote from './vote'
import Bribe from './bribe/create'

import { useRouter } from 'next/router'

function Route({ changeTheme, ...props }) {
  const router = useRouter()
  const activePath = router.asPath
  if (activePath.includes('/vote')) {
    return <Vote props={props} changeTheme={changeTheme} />
  } else if (activePath.includes('/bribe')) {
    return <Bribe props={props} changeTheme={changeTheme} />
  }
}

export default Route
