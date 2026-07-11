import { jsx as _jsx } from "react/jsx-runtime";
/* eslint-disable react/require-default-props */
/* eslint-disable react/prop-types */
import setClass from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { Compute } from "@mat3ra/ive";
export default function ComputeTab(props) {
    const { className, id, role, compute, job, onUpdate, editable, clusters, showHeader, showAdvancedOptions, accountUsers, currentAccount, currentUser, accountUsersIsLoading, } = props;
    return (_jsx("div", { className: setClass(className), id: id, role: role, children: _jsx(Compute, { compute: compute, job: job, user: currentUser, account: currentAccount, onUpdate: onUpdate, editable: editable, clusters: clusters, showHeader: showHeader, showAdvancedOptions: showAdvancedOptions, accountUsers: accountUsers, isAccountUsersLoading: accountUsersIsLoading }) }));
}
ComputeTab.propTypes = {
    compute: PropTypes.object,
    job: PropTypes.object,
    editable: PropTypes.bool,
    showHeader: PropTypes.bool,
    showAdvancedOptions: PropTypes.bool,
    /* handlers */
    onUpdate: PropTypes.func,
    /* compute */
    accountUsers: PropTypes.arrayOf(PropTypes.object).isRequired,
    accountUsersIsLoading: PropTypes.bool.isRequired,
    currentUser: PropTypes.object.isRequired,
    currentAccount: PropTypes.object.isRequired,
    clusters: PropTypes.arrayOf(PropTypes.object).isRequired,
};
ComputeTab.defaultProps = {
    editable: false,
    showHeader: true,
};
