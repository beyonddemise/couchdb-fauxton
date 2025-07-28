// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

import React from "react";
import FauxtonAPI from "../../../core/api";
import ClusterActions from "../../cluster/actions";
import { AuthLayout } from "./../layout";
import app from "../../../app";
import Components from "./../components";
import {logout} from '../actions';
import Idp from "../idp";

const {
  LoginForm,
  CreateAdminForm
} = Components;

const crumbs = [{ name: "Log In to CouchDB" }];

export default FauxtonAPI.RouteObject.extend({
  routes: {
    "login?*extra": "login",
    "login": "login",
    "logout": "logout",
    "session_state*": "idpCallback",
    "createAdmin": "checkNodes",
    "createAdmin/:node": "createAdminForNode"
  },
  checkNodes() {
    ClusterActions.navigateToNodeBasedOnNodeCount("/createAdmin/");
  },
  login() {
    return (
      <AuthLayout
        crumbs={crumbs}
        component={<LoginForm urlBack={app.getParams().urlback} />}
      />
    );
  },
  logout() {
    logout();
  },
  idpCallback() {
    const hashParams = window.location.hash.substring(1); // Remove '#'
    const urlParams = new URLSearchParams(hashParams);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      FauxtonAPI.addNotification({
        msg: 'Authentication failed: Missing tokens',
        type: 'error'
      });
      FauxtonAPI.navigate('/login');
      return;
    }

    localStorage.setItem('fauxtonToken', accessToken);
    localStorage.setItem('fauxtonRefreshToken', refreshToken);

    try {
      const expiry = Idp.getExpiry(accessToken);
      // Schedule token refresh
      setTimeout(() => {
        Idp.refreshToken();
      }, (expiry - 60) * 1000);

      FauxtonAPI.addNotification({
        msg: 'Successfully logged in via IdP',
        type: 'success'
      });
      FauxtonAPI.navigate('/');
    } catch (error) {
      FauxtonAPI.addNotification({
        msg: 'Token validation failed',
        type: 'error'
      });
      localStorage.removeItem('fauxtonToken');
      localStorage.removeItem('fauxtonRefreshToken');
      FauxtonAPI.navigate('/login');
    }
  },
  createAdminForNode() {
    ClusterActions.fetchNodes();
    const crumbs = [{ name: "Create Admin" }];
    return (
      <AuthLayout
        crumbs={crumbs}
        component={<CreateAdminForm loginAfter={true} />}
      />
    );
  }
});
