import React from 'react';
import HelpContent from '../elements/HelpContent';
import welcomeImage from '../../assets/images/welcome.jpg';

class Welcome extends React.Component {
  render() {
    return (
      <div className="row">
        <div className="column large-8 medium-10 small-12">
          <div className="Welcome__banner">
            <div className="Welcome__welcome">Welcome to</div>
            <img src={welcomeImage}/>
            <div className="Welcome__caption">Come for the rewards. Stay for the community.</div>
          </div>
          <hr/>
          <HelpContent path="welcome"/>
        </div>
      </div>
    );
  }
}

module.exports = {
  path: 'welcome',
  component: Welcome
};
