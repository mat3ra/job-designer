import * as React from "react";

declare global {
    const Router: any;
    const require: any;
}

declare module "/imports/*" {
    type Any = any;

    export interface DefaultExport {
        [key: string]: any;
    }
    export const DefaultExport: any;
    export default DefaultExport;

    // Named exports (both types and values)
    export namespace DialogType {
        export interface SelectMaterialsExplorer {
            [key: string]: any;
        }
        export const SelectMaterialsExplorer: any;
        export interface SelectParentJobExplorer {
            [key: string]: any;
        }
        export const SelectParentJobExplorer: any;
        export interface SelectWorkflowExplorer {
            [key: string]: any;
        }
        export const SelectWorkflowExplorer: any;
        export interface DatasetUploadsExplorer {
            [key: string]: any;
        }
        export const DatasetUploadsExplorer: any;
        export interface PseudoUpload {
            [key: string]: any;
        }
        export const PseudoUpload: any;
        export interface UnitTypeSelect {
            [key: string]: any;
        }
        export const UnitTypeSelect: any;
    }
    export const DialogType: any;

    export interface ReduxDialogState<T = any> extends Array<any> {
        [key: string]: any;
    }
    export const ReduxDialogState: any;

    export const CorePropertyHolder: any;
    export type CorePropertyHolder = any;

    export const CoreMetaPropertyHolder: any;
    export type CoreMetaPropertyHolder = any;

    export const FulfilledUserState: any;
    export type FulfilledUserState = any;

    export const CoreUser: any;
    export type CoreUser = any;

    export const WebappBackendNodesSchema: any;
    export type WebappBackendNodesSchema = any;

    export const FulfilledProfileState: any;
    export type FulfilledProfileState = any;

    export const FulfilledAccountState: any;
    export type FulfilledAccountState = any;

    export const MetaPropertiesCreatePropertyConfig: any;
    export type MetaPropertiesCreatePropertyConfig = any;

    export const WebappMetaPropertyHolderSchema: any;
    export type WebappMetaPropertyHolderSchema = any;

    export const TabItem: any;
    export type TabItem = any;

    export const SubworkflowDesignerUpdate: any;
    export type SubworkflowDesignerUpdate = any;

    export const Material: any;
    export type Material = any;

    export const ExecutionUnitSchema: any;
    export type ExecutionUnitSchema = any;

    export const HistorySchema: any;
    export type HistorySchema = any;

    export const AccessType: any;
    export type AccessType = any;

    export const ClusterNode: any;
    export type ClusterNode = any;

    export const UISchema: any;
    export type UISchema = any;

    export const Account: any;
    export type Account = any;

    export const Queue: any;
    export type Queue = any;

    export const Job: any;
    export type Job = any;

    export const CloudFileSchema: any;
    export type CloudFileSchema = any;

    export const SubscriptionsReducer: any;
    export type SubscriptionsReducer = any;

    export const WebappMaterialSchema: any;
    export type WebappMaterialSchema = any;

    export const IronRouter: any;
    export type IronRouter = any;

    export const Workflow: any;
    export type Workflow = any;

    export const CoreMaterial: any;
    export type CoreMaterial = any;

    export const CoreProject: any;
    export type CoreProject = any;

    export const CoreEntitySet: any;
    export type CoreEntitySet = any;

    export const SelectMaterialsExplorer: any;
    export const SelectParentJobExplorer: any;
    export const SelectWorkflowExplorer: any;
    export const DatasetUploadsExplorer: any;
    export const UnitModalProps: any;
    export const PseudoUpload: any;
    export const UnitTypeSelect: any;
    export const ExecutableSchema: any;
    export type ExecutableSchema = any;
    export const FlavorSchema: any;
    export type FlavorSchema = any;
    export const PseudopotentialMetaProperty: any;
    export type PseudopotentialMetaProperty = any;
    export const appSettingsClient: any;
    export const ElementAvatar: any;

    export const CardFooter: any;
    export const CardHeader: any;
    export const InfoPopoverWithDocumentationDialog: any;
    export const getDefaultComputeConfig: any;
    export const SelectFieldComponent: any;
    export const TextFieldComponent: any;
    export const resolveSimpleSchema: any;
    export const useAppDispatch: any;
    export const createWorkflowEntity: any;
    export const useProfile: any;
    export const useDefaultWorkflow: any;
    export const RouteName: any;
    export const getRouterQueryParam: any;
    export const goToUrl: any;
    export const openWorkflowsList: any;
    export const pathFor: any;
    export const useRouterParams: any;
    export const updateWorkflowEntity: any;
    export const useFetchWorkflow: any;
    export const hydrateWorkflowItemEntity: any;
    export const usePublicAccount: any;
    export const useClusterNodes: any;
    export const useDefaultMaterial: any;
    export const useTemplatesListAll: any;
    export const LoadingIndicator: any;
    export const resolveUISchema: any;
    export const useReduxDialog: any;
    export const ACCESS_TYPES: any;
    export const useFetchMaterialsList: any;
    export const setJobNameBasedOnMaterials: any;
    export const DEFAULT_FILES_PREFIX: any;
    export const defaultDataset: any;
    export const isLoadingReducer: any;
    export const createReducer: any;
    export const ClustersLoadHandler: any;
    export const triggerChartsResize: any;
    export const getJobIdFromCurrentRoute: any;
    export const ENTITY_ICONS: any;
    export const useMemoParams: any;
    export const useSelectedJob: any;
    export const useMetaPropertiesList: any;
    export const useProject: any;
    export const isEntitySet: any;
    export const getInSetFromRoute: any;
    export const DataListId: any;
    export const useFetchPropertiesList: any;

    export const downloadAndProcessFile: any;
    export const handleGetSignedURL: any;
    export const handleGetSignedUrlAsCSV: any;
    export const calculateFermiEnergy: any;
    export const FilesExplorerContainer: any;
    export const useFetchProjectsList: any;
    export const fetchMetaPropertiesList: any;
    export const fetchWorkflow: any;
    export const listMaterials: any;
    export const createMetaProperty: any;

    export const WorkflowProps: any;
    export type WorkflowProps = any;
    export const ResultsProps: any;
    export type ResultsProps = any;

    // Component and specific exports for imports
    export const PseudoForm: any;
    export const SubworkflowFormTitle: any;
    export const EntityHeader: any;
    export const TabsMenu: any;
    export const EntityName: any;
    export const Loading: any;
    export const HeightContainer: any;
    export const applySubworkflowUpdateToWorkflow: any;
    export const createJobDesignerReducer: any;
    export const updateJob: any;
    export const setMaterials: any;
    export const syncJobWorkflow: any;
    export const UnitStatus: any;
    export const Made: any;
    export const PointsPathFormDataProvider: any;
    export const isWodeSubworkflowInstance: any;
    export const UnitsFlowchartContainer: any;
    export const SubworkflowForm: any;
    export const Model: any;
    export const Results: any;
    export const History: any;
    export const Metadata: any;
    export const NotFoundPage: any;
    export const DataGridComponent: any;
    export const DataFrameIOUnitResultCheckbox: any;
    export const ErrorUnitContent: any;
    export const ExecutionUnitViewer: any;

    export const CoreAccount: any;
    export type CoreAccount = any;
}

declare module "meteor/*" {
    type Any = any;
    export interface DefaultExport {
        [key: string]: any;
    }
    export const DefaultExport: any;
    export default DefaultExport;
    export const Meteor: any;
    export const Mongo: any;
    export const Tracker: any;
    export const ReactiveVar: any;
    export const Session: any;
    export const Accounts: any;
    export const Template: any;
    export const Blaze: any;

    export const applySubworkflowUpdateToWorkflow: any;
    export const isWodeSubworkflowInstance: any;
    export const updateJob: any;
    export const setMaterials: any;
    export const syncJobWorkflow: any;
    export const createJobDesignerReducer: any;
    export const BaseUnit: any;
    export const UnitStatus: any;
    export const Made: any;
    export const PointsPathFormDataProvider: any;
    export const DataFrameIOUnitResultCheckbox: any;
    export const ErrorUnitContent: any;
    export const QUEUE_DISPLAY: any;
    export const UnitPointerField: any;
    export const ConvergencesList: any;
    export const PropertyFactory: any;
    export const PropertyName: any;
    export const Chart: any;
    export const ResultsView: any;
}

declare module "meteor/meteor" {
    export const Meteor: any;
    export default Meteor;
}
declare module "meteor/mongo" {
    export const Mongo: any;
    export default Mongo;
}
declare module "meteor/tracker" {
    export const Tracker: any;
    export default Tracker;
}
declare module "meteor/reactive-var" {
    export const ReactiveVar: any;
    export default ReactiveVar;
}
declare module "meteor/session" {
    export const Session: any;
    export default Session;
}

declare module "redux-logger" {
    const logger: any;
    export default logger;
}
declare module "simple-react-form" {
    export const Field: any;
    export const Form: any;
    const simpleReactForm: any;
    export default simpleReactForm;
}
declare module "flat" {
    export const flatten: any;
    export const unflatten: any;
    const flat: any;
    export default flat;
}
declare module "path" {
    export const basename: any;
    export const dirname: any;
    export const join: any;
    export const resolve: any;
    const path: any;
    export default path;
}

declare module "@mat3ra/wove" {
    export const ExtraImportantSettingsByContextProvider: any;
    export const getUnitStatusCls: any;
    export const getWorkflowStatusCls: any;
    export const Properties: any;
    export const UnitsAccordion: any;
    export const OverviewAccordion: any;
    export const WorkflowUnitsFlowchart: any;
    export const UnitsFlowchartContainer: any;
    export const UnitCard: any;
    export const isExecutionUnit: any;
}
declare module "@mat3ra/workflow-designer" {
    export const WorkflowDesignerCreatePage: any;
    export const WorkflowDesignerEditPage: any;
    export const WorkflowDesignerContainer: any;
    export const WorkflowDesignerShell: any;
    export const Workflow: any;
    export type WorkflowProps = any;
    export const WorkflowDefaultLayout: any;
    export const Convergence: any;
    export type ConvergenceProps = any;
    export const UnitModal: any;
    export const UnitPaste: any;
    export const UnitTypeSelect: any;
    export type UnitTypeSelectProps = any;
    export const isWodeSubworkflowInstance: any;
    export const applySubworkflowUpdateToWorkflow: any;
    export type SubworkflowDesignerUpdate = any;
    export const getWorkflowDesignerTabResetKey: any;
    export const shouldResetWorkflowDesignerUiState: any;
    export const UnitPointerField: any;
    export const Subworkflow: any;
    export const SubworkflowHeader: any;
    export const ImportantSettings: any;
    export const WorkflowValidationAlert: any;
    export const useWorkflowReduxDialogs: any;
    export const reportWorkflowSaveError: any;
    export type SaveWorkflowFromDesigner = any;
    export const UnitDetails: any;
}
declare module "@mat3ra/ive" {
    export const Compute: any;
    export const ComputeForm: any;
    export const ComputeHandler: any;
    export const QueuesTable: any;
    export const StatusTrackTable: any;
}
declare module "@mat3ra/ave" {
    export const Application: any;
    export const UnitOutput: any;
    export const Results: any;
    export const ExecutionUnit: any;
    export const ExecutionUnitViewer: any;
    export const ExecutionUnitInputFilePanel: any;
}
declare module "@mat3ra/move" {
    const MethodData: any;
    export default MethodData;
    export const Model: any;
    export const Method: any;
    export const BrillouinZoneImage: any;
    export const PseudoList: any;
    export const PseudoPanel: any;
    export const PseudoSearchBar: any;
}
declare module "@mat3ra/move/pseudo" {
    export const FixedRJSForm: any;
    export const PseudoUploadDialog: any;
    export const PseudoForm: any;
}
declare module "@mat3ra/jove" {
    export const ResultsTab: any;
    export const UnitResult: any;
    export const ConvergenceChart: any;
    export type ResultsProps = any;
    export const ResultsProps: any;
}
declare module "@mat3ra/job-designer" {
    export const Job: any;
    export const JobContainer: any;
    export const JobLocalReduxContainer: any;
    export const JobGlobalReduxContainer: any;
}

declare module "@mat3ra/made" {
    export const Made: any;
    export type Made = any;
    export const Material: any;
    export type Material = any;
}

declare module "@mat3ra/ide" {
    const DefaultExport: any;
    export default DefaultExport;
}

declare module "@mat3ra/prode" {
    const DefaultExport: any;
    export default DefaultExport;
    export const PropertyName: any;
}

declare module "@mat3ra/prove" {
    const DefaultExport: any;
    export default DefaultExport;
    export const ResultsView: any;
}

export {};
