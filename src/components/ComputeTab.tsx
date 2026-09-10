import { Compute } from "@mat3ra/ive";
import setClass from "classnames";
import React from "react";

export interface ComputeTabProps {
    className?: string;
    id?: string;
    role?: string;
    compute?: any;
    job?: any;
    editable?: boolean;
    showHeader?: boolean;
    showAdvancedOptions?: boolean;
    /* handlers */
    onUpdate?: (compute: any) => void;
    /* compute */
    accountUsers: any[];
    accountUsersIsLoading: boolean;
    currentUser: any;
    currentAccount: any;
    clusters: any[];
}

export default function ComputeTab({
    className,
    id,
    role,
    compute,
    job,
    onUpdate,
    editable = false,
    clusters,
    showHeader = true,
    showAdvancedOptions,
    accountUsers,
    currentAccount,
    currentUser,
    accountUsersIsLoading,
}: ComputeTabProps) {
    return (
        <div className={setClass(className)} id={id} role={role}>
            <Compute
                compute={compute}
                job={job}
                user={currentUser}
                account={currentAccount}
                onUpdate={onUpdate}
                editable={editable}
                clusters={clusters}
                showHeader={showHeader}
                showAdvancedOptions={showAdvancedOptions}
                accountUsers={accountUsers}
                isAccountUsersLoading={accountUsersIsLoading}
            />
        </div>
    );
}
