import JobDesignerWidget from "./JobDesignerWidget";
import Page from "./Page";

const wrapper = "#root";

export default class JobDesignerPage extends Page {
    designerWidget: JobDesignerWidget;

    constructor() {
        super(wrapper);
        this.designerWidget = new JobDesignerWidget(wrapper);
    }
}
