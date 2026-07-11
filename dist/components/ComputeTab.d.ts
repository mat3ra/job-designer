declare function ComputeTab(props: any): React.JSX.Element;
declare namespace ComputeTab {
    namespace propTypes {
        let compute: PropTypes.Requireable<object>;
        let job: PropTypes.Requireable<object>;
        let editable: PropTypes.Requireable<boolean>;
        let showHeader: PropTypes.Requireable<boolean>;
        let showAdvancedOptions: PropTypes.Requireable<boolean>;
        let onUpdate: PropTypes.Requireable<(...args: any[]) => any>;
        let accountUsers: PropTypes.Validator<object[]>;
        let accountUsersIsLoading: PropTypes.Validator<boolean>;
        let currentUser: PropTypes.Validator<object>;
        let currentAccount: PropTypes.Validator<object>;
        let clusters: PropTypes.Validator<object[]>;
    }
    namespace defaultProps {
        let editable_1: boolean;
        export { editable_1 as editable };
        let showHeader_1: boolean;
        export { showHeader_1 as showHeader };
    }
}
export default ComputeTab;
import React from "react";
import PropTypes from "prop-types";
//# sourceMappingURL=ComputeTab.d.ts.map