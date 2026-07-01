export const StatePropsCompareOnUpdateForJobMIxin = (superclass) =>
    class extends superclass {
        shouldComponentUpdateForJob(nextProps, nextState) {
            if (
                nextProps.job &&
                this.props.job &&
                nextProps.job.isInFinalStatus &&
                nextProps.job.status === this.props.job.status &&
                nextProps.index === this.props.index && // reload JobDesigner on index change when job.isInFinalStatus=1
                nextState.numberOfDescriptionUpdates === this.state.numberOfDescriptionUpdates &&
                nextProps.isLoading === this.props.isLoading
            )
                return false;

            const [nextProps_, thisProps_, nextState_, thisState_] = [
                nextProps,
                this.props,
                nextState,
                this.state,
            ].map(JSON.stringify, (key, value) =>
                value && typeof value.toJSON === "function" && key !== ""
                    ? value.toJSON() // no key arg — omit list stays []
                    : value,
            );

            return !(nextProps_ === thisProps_) || !(nextState_ === thisState_);
        }
    };
