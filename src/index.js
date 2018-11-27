import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import { createGlobalStyle } from 'styled-components';
import reset from 'styled-reset';
import "babel-polyfill";

import Globe from './views/Globe';
import Countries from './views/Countries';
import Starfield from './views/Starfield';

const GlobalStyle = createGlobalStyle`
    ${reset}

    body {
        background: black;
        overflow: hidden;
        height: 100vh;
    }
`;

class Application extends Component {
    render() {
        return [
            <GlobalStyle key="styles" />,
            <Fragment key="content">
                <Globe />
                <Countries />
                <Starfield />
            </Fragment>
        ];
    }
}

ReactDOM.render(
    <Application />,
    document.getElementById('app')
);
