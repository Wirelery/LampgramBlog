import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom';
import reactForm from '../../utils/ReactForm';
import {Map} from 'immutable';
import transaction from '../../redux/Transaction';
import user from '../../redux/User';
import LoadingIndicator from '../elements/LoadingIndicator';
import runTests, {browserTests} from '../../utils/BrowserTests'
import {validate_account_name, validate_memo_field} from '../../utils/ChainValidation';
import {countDecimals} from '../../utils/ParsersAndFormatters'
import tt from 'counterpart';
import {APP_NAME, LIQUID_TOKEN, VESTING_TOKEN} from '../../client_config';
import {connect} from 'react-redux'

/** Warning .. This is used for Power UP too. */
class TransferForm extends Component {

  static propTypes = {
    // redux
    currentUser: PropTypes.object.isRequired,
    toVesting: PropTypes.bool.isRequired,
    currentAccount: PropTypes.object.isRequired,
  };

  constructor(props) {
    super();
    const {transferToSelf} = props;
    this.state = {advanced: !transferToSelf};
    this.initForm(props)
  }

  componentDidMount() {
    setTimeout(() => {
      const {advanced} = this.state;
      if (advanced)
        ReactDOM.findDOMNode(this.refs.to).focus();
      else
        ReactDOM.findDOMNode(this.refs.amount).focus()
    }, 300);
    runTests()
  }

  onAdvanced = (e) => {
    e.preventDefault(); // prevent form submission!!
    const username = this.props.currentUser.get('username');
    this.state.to.props.onChange(username);
    // setTimeout(() => {ReactDOM.findDOMNode(this.refs.amount).focus()}, 300)
    this.setState({advanced: !this.state.advanced})
  };

  initForm(props) {
    const {transferType} = props.initialValues;
    const insufficientFunds = (asset, amount) => {
      const {currentAccount} = props;
      const balanceValue =
        !asset || asset === 'SMOKE' ? currentAccount.get('balance') : null;
      if (!balanceValue) return false;
      const balance = balanceValue.split(' ')[0];
      return parseFloat(amount) > parseFloat(balance)
    };
    const {toVesting} = props;
    const fields = toVesting ? ['to', 'amount'] : ['to', 'amount', 'asset'];
    if (!toVesting)
      fields.push('memo');
    reactForm({
      name: 'transfer',
      instance: this, fields,
      initialValues: props.initialValues,
      validation: values => ({
        to:
          !values.to ? tt('g.required') : validate_account_name(values.to, values.memo),
        amount:
          !values.amount ? 'Required' :
            !/^\d+(\.\d+)?$/.test(values.amount) ? tt('transfer_jsx.amount_is_in_form') :
              insufficientFunds(values.asset, values.amount) ? tt('transfer_jsx.insufficient_funds') :
                countDecimals(values.amount) > 3 ? tt('transfer_jsx.use_only_3_digits_of_precison') :
                  null,
        asset:
          props.toVesting ? null :
            !values.asset ? tt('g.required') : null,
        memo:
          values.memo ? validate_memo_field(values.memo, props.currentUser.get('username'), props.currentAccount.get('memo_key')) :
            values.memo && (!browserTests.memo_encryption && /^#/.test(values.memo)) ?
              'Encrypted memos are temporarily unavailable (issue #98)' :
              null,
      })
    })
  }

  clearError = () => {
    this.setState({trxError: undefined})
  };

  errorCallback = estr => {
    this.setState({trxError: estr, loading: false})
  };

  balanceValue() {
    const {transferType} = this.props.initialValues;
    const {currentAccount} = this.props;
    const {asset} = this.state;
    return !asset ||
    asset.value === 'SMOKE' ? currentAccount.get('balance') : null
  }

  assetBalanceClick = e => {
    e.preventDefault();
    // Convert '9.999 SMOKE' to 9.999
    this.state.amount.props.onChange(this.balanceValue().split(' ')[0])
  };

  onChangeTo = (e) => {
    const {value} = e.target;
    this.state.to.props.onChange(value.toLowerCase().trim())
  };

  render() {
    const transferTips = {
      'Transfer to Account': tt('transfer_jsx.move_funds_to_another_account', {APP_NAME}),
    };
    const powerTip3 = tt('tips_js.converted_VESTING_TOKEN_can_be_sent_to_yourself_but_can_not_transfer_again', {
      LIQUID_TOKEN,
      VESTING_TOKEN
    })
    const {to, amount, asset, memo} = this.state;
    const {loading, trxError, advanced} = this.state;
    const {currentUser, toVesting, transferToSelf, dispatchSubmit} = this.props;
    const {transferType} = this.props.initialValues;
    const {submitting, valid, handleSubmit} = this.state.transfer;
    // const isMemoPrivate = memo && /^#/.test(memo.value); -- private memos are not supported yet
    const isMemoPrivate = false;
    const form = (
      <form onSubmit={handleSubmit(({data}) => {
        this.setState({loading: true});
        dispatchSubmit({...data, errorCallback: this.errorCallback, currentUser, toVesting, transferType})
      })}
            onChange={this.clearError}
      >
        {toVesting && <div className="row">
          <div className="column small-12">
            <p>{tt('tips_js.influence_token')}</p>
            <p>{tt('tips_js.non_transferable', {LIQUID_TOKEN, VESTING_TOKEN})}</p>
          </div>
        </div>}

        {!toVesting && <div>
          <div className="row">
            <div className="column small-12">
              {transferTips[transferType]}
            </div>
          </div>
          <br/>
        </div>}

        <div className="row">
          <div className="column small-2" style={{paddingTop: 5}}>{tt('transfer_jsx.from')}</div>
          <div className="column small-10">
            <div className="input-group" style={{marginBottom: "1.25rem"}}>
              <span className="input-group-label">@</span>
              <input
                className="input-group-field bold"
                type="text"
                disabled
                value={currentUser.get('username')}
              />
            </div>
          </div>
        </div>

        {advanced && <div className="row">
          <div className="column small-2" style={{paddingTop: 5}}>{tt('transfer_jsx.to')}</div>
          <div className="column small-10">
            <div className="input-group" style={{marginBottom: "1.25rem"}}>
              <span className="input-group-label">@</span>
              <input
                className="input-group-field"
                ref="to"
                type="text"
                placeholder={tt('transfer_jsx.send_to_account')}
                onChange={this.onChangeTo}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                disabled={loading}
                {...to.props}
              />
            </div>
            {to.touched && to.blur && to.error ?
              <div className="error">{to.error}&nbsp;</div> :
              <p>{toVesting && powerTip3}</p>
            }
          </div>
        </div>}

        <div className="row">
          <div className="column small-2" style={{paddingTop: 5}}>{tt('g.amount')}</div>
          <div className="column small-10">
            <div className="input-group" style={{marginBottom: 5}}>
              <input type="text" placeholder={tt('g.amount')} {...amount.props} ref="amount"
                     autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
                     disabled={loading}/>
              {asset && <span className="input-group-label" style={{paddingLeft: 0, paddingRight: 0}}>
                                <select {...asset.props} placeholder={tt('transfer_jsx.asset')} disabled={loading}
                                        style={{
                                          minWidth: "5rem",
                                          height: "inherit",
                                          backgroundColor: "transparent",
                                          border: "none"
                                        }}>
                                    <option value="SMOKE">SMOKE</option>
                                </select>
                            </span>}
            </div>
            <div style={{marginBottom: "0.6rem"}}>
              <AssetBalance balanceValue={this.balanceValue()} onClick={this.assetBalanceClick}/>
            </div>
            {(asset && asset.touched && asset.error) || (amount.touched && amount.error) ?
              <div className="error">
                {asset && asset.touched && asset.error && asset.error}&nbsp;
                {amount.touched && amount.error && amount.error}&nbsp;
              </div> : null}
          </div>
        </div>

        {memo && <div className="row">
          <div className="column small-2" style={{paddingTop: 33}}>{tt('g.memo')}</div>
          <div className="column small-10">
            <small>{isMemoPrivate ? tt('transfer_jsx.this_memo_is_private') : tt('transfer_jsx.this_memo_is_public')}</small>
            <input type="text" placeholder={tt('g.memo')} {...memo.props}
                   ref="memo" autoComplete="on" autoCorrect="off" autoCapitalize="off" spellCheck="false"
                   disabled={loading}/>
            <div className="error">{memo.touched && memo.error && memo.error}&nbsp;</div>
          </div>
        </div>}
        <div className="row">
          <div className="column">
            {loading && <span><LoadingIndicator type="circle"/><br/></span>}
            {!loading && <span>
                            {trxError && <div className="error">{trxError}</div>}
            <div className="walletButtonsMobile">
              <button type="submit" disabled={submitting || !valid} className="button">
                                {toVesting ? tt('g.power_up') : tt('g.submit')}
                            </button>
              {transferToSelf && <button className="button hollow no-border" disabled={submitting}
                                         onClick={this.onAdvanced}>{advanced ? tt('g.basic') : tt('g.advanced')}</button>}
            </div>
                        </span>}
          </div>
        </div>
      </form>
    );
    return (
      <div>
        <div className="row">
          <h3
            className="column">{toVesting ? tt('transfer_jsx.convert_to_VESTING_TOKEN', {VESTING_TOKEN}) : transferType}</h3>
        </div>
        {form}
      </div>
    )
  }
}

const AssetBalance = ({onClick, balanceValue}) =>
  <a onClick={onClick}
     style={{borderBottom: '#A09F9F 1px dotted', cursor: 'pointer'}}>{tt('g.balance') + ": " + balanceValue}</a>;

export default connect(
  // mapStateToProps
  (state, ownProps) => {
    const initialValues = state.user.get('transfer_defaults', Map()).toJS();
    const toVesting = initialValues.asset === 'VESTS';
    const currentUser = state.user.getIn(['current']);
    const currentAccount = state.global.getIn(['accounts', currentUser.get('username')]);

    if (!toVesting && !initialValues.transferType)
      initialValues.transferType = 'Transfer to Account';

    let transferToSelf = toVesting;
    if (transferToSelf && !initialValues.to)
      initialValues.to = currentUser.get('username');

    if (initialValues.to !== currentUser.get('username'))
      transferToSelf = false // don't hide the to field

    return {...ownProps, currentUser, currentAccount, toVesting, transferToSelf, initialValues}
  },

  // mapDispatchToProps
  dispatch => ({
    dispatchSubmit: ({
                       to, amount, asset, memo, transferType,
                       toVesting, currentUser, errorCallback
                     }) => {
      if (!toVesting && !/Transfer to Account/.test(transferType))
        throw new Error(`Invalid transfer params: toVesting ${toVesting}, transferType ${transferType}`);

      const username = currentUser.get('username');
      const successCallback = () => {
        // refresh transfer history
        dispatch({type: 'global/GET_STATE', payload: {url: `@${username}/transfers`}});
        dispatch(user.actions.hideTransfer())
      };
      const asset2 = toVesting ? 'SMOKE' : asset;
      const operation = {
        from: username,
        to, amount: parseFloat(amount, 10).toFixed(3) + ' ' + asset2,
        memo: toVesting ? undefined : (memo ? memo : '')
      }

      dispatch(transaction.actions.broadcastOperation({
        type: toVesting ? 'transfer_to_vesting' : (
          transferType === 'Transfer to Account' ? 'transfer' : null
        ),
        operation,
        successCallback,
        errorCallback
      }))
    }
  })
)(TransferForm)
