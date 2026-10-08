import JobDesignerWidget from "./JobDesignerWidget";
import Page from "./Page";
import StandaloneTopBarWidget from "./StandaloneTopBarWidget";

const wrapper = "#root";

export default class JobDesignerPage extends Page {
    designerWidget: JobDesignerWidget;

    topBar: StandaloneTopBarWidget;

    constructor() {
        super(wrapper);
        this.designerWidget = new JobDesignerWidget(wrapper);
        this.topBar = new StandaloneTopBarWidget(wrapper);
    }
}
