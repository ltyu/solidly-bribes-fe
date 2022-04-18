import {
  Typography,
  Button,
  Paper,
  SvgIcon,
  Toolbar,
  Grid,
  Select,
  MenuItem,
  InputAdornment,
  TextField,
} from '@material-ui/core'
import SearchIcon from '@material-ui/icons/Search'

import SSBribes from '../../components/ssBribes'

import { useState, useEffect } from 'react'
import { ACTIONS } from '../../stores/constants'
import { formatCurrency } from '../../utils'

import stores from '../../stores'
import { useRouter } from 'next/router'
import Unlock from '../../components/unlock'
import EnhancedEncryptionOutlinedIcon from '@material-ui/icons/CreateOutlined'

import classes from './bribe.module.css'
function BalanceIcon(props) {
  const { color, className } = props
  return (
    <SvgIcon viewBox="0 0 64 64" strokeWidth="1" className={className}>
      <g strokeWidth="1" transform="translate(0, 0)">
        <path
          data-color="color-2"
          fill="none"
          stroke="#4585d6"
          strokeWidth="1"
          strokeLinecap="square"
          strokeMiterlimit="10"
          d="M40,28 c0-3.8,6-10,6-10s6,6.2,6,10s-3,6-6,6S40,31.8,40,28z"
          strokeLinejoin="miter"
        ></path>{' '}
        <path
          data-color="color-2"
          fill="none"
          stroke="#4585d6"
          strokeWidth="1"
          strokeLinecap="square"
          strokeMiterlimit="10"
          d="M20,14 c0-3.8,6-10,6-10s6,6.2,6,10s-3,6-6,6S20,17.8,20,14z"
          strokeLinejoin="miter"
        ></path>{' '}
        <path
          data-cap="butt"
          fill="none"
          stroke="#4585d6"
          strokeWidth="1"
          strokeMiterlimit="10"
          d="M10,34h2c4.6,0,9.6,2.4,12,6h8 c4,0,8,4,8,8H22"
          strokeLinejoin="miter"
          strokeLinecap="butt"
        ></path>{' '}
        <path
          data-cap="butt"
          fill="none"
          stroke="#4585d6"
          strokeWidth="1"
          strokeMiterlimit="10"
          d="M38.8,44H52c7.2,0,8,4,8,4L31.4,59.6 c-2.2,1-4.8,0.8-7-0.2L10,52"
          strokeLinejoin="miter"
          strokeLinecap="butt"
        ></path>{' '}
        <rect
          x="2"
          y="30"
          fill="none"
          stroke="#4585d6"
          strokeWidth="1"
          strokeLinecap="square"
          strokeMiterlimit="10"
          width="8"
          height="26"
          strokeLinejoin="miter"
        ></rect>
      </g>
    </SvgIcon>
  )
}

// TODO extract this out into its own component as it is used in multiple places
export const NftDropdown = () => {
  const [token, setToken] = useState({}) // value
  const [vestNFTs, setVestNFTs] = useState(stores.stableSwapStore.getStore('vestNFTs'))
  const [veToken, setVeToken] = useState(stores.stableSwapStore.getStore('veToken'))

  const onSelect = (event) => {
    setToken(event.target.value)
    stores.dispatcher.dispatch({ type: ACTIONS.GET_BRIBE_REWARDS, content: { nftId: event.target.value.id } })
  }

  useEffect(() => {
    setVeToken(stores.stableSwapStore.getStore('veToken'))
  }, [])

  useEffect(() => {
    if (vestNFTs.length) {
      setToken(vestNFTs[0])
    }
  }, [vestNFTs])

  useEffect(() => {
    if (token.id) {
      stores.dispatcher.dispatch({ type: ACTIONS.GET_BRIBE_REWARDS, content: { nftId: token.id } })
    }
  }, [token])

  return (
    <div className={classes.textField}>
      <div className={classes.mediumInputContainer}>
        <Grid container>
          <Grid item lg="auto" md="auto" sm={12} xs={12}>
            <Typography variant="body2" className={classes.smallText}>
              Please select your veNFT:
            </Typography>
          </Grid>

          <Grid item lg={6} md={6} sm={12} xs={12}>
            <div className={classes.mediumInputAmount}>
              <Select
                fullWidth
                value={token}
                onChange={onSelect}
                inputProps={{
                  className: classes.mediumInput,
                }}
              >
                {vestNFTs.map((vestNft) => {
                  return (
                    <MenuItem key={vestNft.id} value={vestNft}>
                      <div className={classes.menuOption}>
                        <Typography>
                          Token #{vestNft.id}
                          {vestNft.isVoteLocked ? ' (Vote Locked)' : ''}
                        </Typography>
                        <div>
                          <Typography align="right" className={classes.smallerText}>
                            {formatCurrency(vestNft.lockValue)}
                          </Typography>
                          <Typography color="textSecondary" className={classes.smallerText}>
                            {veToken?.symbol}
                          </Typography>
                        </div>
                      </div>
                    </MenuItem>
                  )
                })}
              </Select>
            </div>
          </Grid>
        </Grid>
      </div>
    </div>
  )
}

export const EnhancedTableToolbar = ({ search, onSearchChanged }) => {
  const router = useRouter()

  const onCreate = () => {
    router.push('/bribe/create')
  }

  return (
    <Toolbar
      style={{
        margin: '24px 0px',
        padding: '0px',
      }}
    >
      <Grid container spacing={1}>
        <Grid item lg={true} md={true} sm={12} xs={12}>
          <TextField
            className={classes.searchContainer}
            variant="outlined"
            fullWidth
            placeholder="FTM, MIM, 0x..."
            value={search}
            onChange={onSearchChanged}
            inputProps={{
              startadornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item lg="auto" md={12} sm={12} xs={12}>
          <div className={classes.tokenIDContainer}>{NftDropdown()}</div>
        </Grid>
        <Grid item lg="auto" md={12} sm={12} xs={12}>
          <Button
            variant="contained"
            startIcon={<EnhancedEncryptionOutlinedIcon />}
            size="large"
            style={{
              color: 'rgb(6, 211, 215)',
              background: 'rgb(23, 52, 72)',
              fontWeight: '700',
              width: '100%',
              '&:hover': {
                background: 'rgb(19, 44, 60)',
              },
            }}
            color="primary"
            onClick={onCreate}
          >
            <Typography
              style={{
                fontSize: '15px',
                fontWeight: '700',
              }}
            >
              Create Bribe
            </Typography>
          </Button>
        </Grid>
      </Grid>
    </Toolbar>
  )
}

function Bribes() {
  const accountStore = stores.accountStore.getStore('account')
  const router = useRouter()
  const [account, setAccount] = useState(accountStore)
  const [unlockOpen, setUnlockOpen] = useState(false)

  useEffect(() => {
    const accountConfigure = () => {
      const accountStore = stores.accountStore.getStore('account')
      setAccount(accountStore)
      closeUnlock()
    }
    const connectWallet = () => {
      onAddressClicked()
    }

    stores.emitter.on(ACTIONS.ACCOUNT_CONFIGURED, accountConfigure)
    stores.emitter.on(ACTIONS.CONNECT_WALLET, connectWallet)

    return () => {
      stores.emitter.removeListener(ACTIONS.ACCOUNT_CONFIGURED, accountConfigure)
      stores.emitter.removeListener(ACTIONS.CONNECT_WALLET, connectWallet)
    }
  }, [])

  const onAddressClicked = () => {
    setUnlockOpen(true)
  }

  const closeUnlock = () => {
    setUnlockOpen(false)
  }

  return (
    <div className={classes.ffContainer}>
      {account && account.address ? (
        <div className={classes.connected}>
          <SSBribes />
        </div>
      ) : (
        <Paper className={classes.notConnectedContent}>
          <BalanceIcon className={classes.overviewIcon} />
          <Typography className={classes.mainHeadingNC} variant="h1">
            Bribes
          </Typography>
          <Typography className={classes.mainDescNC} variant="body2">
            Use your veSolid to vote for your selected pool’s rewards distribution or create a bribe to encourage others
            to do the same.
          </Typography>
          <Button disableElevation className={classes.buttonConnect} variant="contained" onClick={onAddressClicked}>
            {account && account.address && <div className={`${classes.accountIcon} ${classes.metamask}`}></div>}
            <Typography>Connect Wallet to Continue</Typography>
          </Button>
        </Paper>
      )}
      {unlockOpen && <Unlock modalOpen={unlockOpen} closeModal={closeUnlock} />}
    </div>
  )
}

export default Bribes
