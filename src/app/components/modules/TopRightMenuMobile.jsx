import React from 'react';
import {browserHistory, Link} from 'react-router';
import {connect} from 'react-redux';
import Icon from '../elements/Icon';
import user from '../../redux/User';
import Userpic from '../elements/Userpic';
import LoadingIndicator from '../elements/LoadingIndicator';
import NotifiCounter from '../elements/NotifiCounter';
import tt from 'counterpart';
import DropdownMobileMenu from '../elements/DropdownMobileMenu';


const defaultNavigate = (event) => {
  if (event.metaKey || event.ctrlKey) {
    // prevent breaking anchor tags
  } else {
    event.preventDefault();
  }
  const a = event.target.nodeName.toLowerCase() === 'a' ? event.target : event.target.parentNode;
  browserHistory.push(a.pathname + a.search + a.hash);
};



function TopRightMenuMobile({username, showLogin, logout, loggedIn, vertical, navigate, probablyLoggedIn, nightmodeEnabled, toggleNightmode, toggleOffCanvasMenu}) {
  const mcn = 'menu' + (vertical ? ' vertical ' : '');
  const hcl = vertical ? '' : 'hide';
  const mcl = vertical ? '' : ' sub-menu';
  const lcn = vertical ? '' : 'show-for-medium';
  const mob = 'mobileTop';

  const nav = navigate || defaultNavigate;
  const submitStory = $STM_Config.read_only_mode ? null : (
    <div className="circleTabs">
      <Link to="/post" onClick={nav}><Icon name="pencil"/></Link>
    </div>);
  const logoutbutton = (
    <div className="circleTabs">
      <a onClick={logout}>
        <Icon name="exit"/>
      </a>
    </div>);
  const accountLink = `/@${username}`;
  const feedLink = `/@${username}/feed`;
  const comments_link = `/@${username}/comments`;
  const replies_link = `/@${username}/recent-replies`;
  const wallet_link = `/@${username}/transfers`;
  const settings_link = `/@${username}/settings`;
  if (loggedIn) {
    const user_menu = [
      { link: accountLink, icon: 'profile', value: tt('main_menu.profile') },
      { link: feedLink, icon: 'home', value: tt('g.feed') },
      { link: comments_link, icon: 'replies', value: tt('g.comments')},
      { link: replies_link, icon: 'reply', value: tt('g.replies') },
      { link: wallet_link, icon: 'wallet', value: tt('g.wallet') },
      { link: settings_link, icon: 'cog', value: tt('g.settings') },
      loggedIn
        ? { link: '###', icon: 'enter', onClick: logout, value: tt('g.logout') }
        : { link: '###', onClick: showLogin, value: tt('g.login') },
    ];
    return (
      <div className={mcn + mcl + mob}>
      <DropdownMobileMenu
                      className={'circleTabs'}
                      items={user_menu}
                      title={username}
                      el="span"
                      selected={tt('g.rewards')}
                      position="left"
                  >
                      <li className={'Header__userpic '}>
                          <span title={username}>
                              <Userpic account={username} />
                          </span>
                      </li>
                  </DropdownMobileMenu>
        <div className="circleTabs"><Link to="/trending"><Icon name="trending"/></Link></div>
        <div className="circleTabs"><a href="/static/search.html"><Icon name="search"/></a></div>
        {submitStory}
      </div>
    );
  }
  if (probablyLoggedIn) {
    return (
      <ul className={mcn + mcl}>
        <li className={lcn} style={{paddingTop: 0, paddingBottom: 0}}>
          <LoadingIndicator type="circle" inline/>
        </li>
        {toggleOffCanvasMenu && <li className="toggle-menu Header__hamburger">
          <a href="#" onClick={toggleOffCanvasMenu}>
            <span className="hamburger"/>
          </a>
        </li>}
      </ul>
    );
  }
  return (
    <div className={mcn + mcl + mob}>
      <div className="circleTabs"><Link to="/login.html"><Icon name="mascot"/></Link></div>
      <div className="circleTabs"><Link to="/trending"><Icon name="trending"/></Link></div>
      <div className="circleTabs"><Link to="/created"><Icon name="lighter"/></Link></div>
      <div className="circleTabs"><Link to="/hot"><Icon name="match"/></Link></div>
    </div>
  );
}

TopRightMenuMobile.propTypes = {
  username: React.PropTypes.string,
  loggedIn: React.PropTypes.bool,
  probablyLoggedIn: React.PropTypes.bool,
  showLogin: React.PropTypes.func.isRequired,
  logout: React.PropTypes.func.isRequired,
  vertical: React.PropTypes.bool,
  navigate: React.PropTypes.func,
  toggleOffCanvasMenu: React.PropTypes.func,
};

export default connect(
  state => {
    if (!process.env.BROWSER) {
      return {
        username: null,
        loggedIn: false,
        probablyLoggedIn: !!state.offchain.get('account')
      }
    }
    const username = state.user.getIn(['current', 'username']);
    const loggedIn = !!username;
    return {
      username,
      loggedIn,
      probablyLoggedIn: false,
    }
  },
  dispatch => ({
    showLogin: (e) => {
      if (e) e.preventDefault();
      dispatch(user.actions.showLogin())
    },
    logout: (e) => {
      if (e) e.preventDefault();
      dispatch(user.actions.logout())
    },
  })
)(TopRightMenuMobile);
