import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import setClass from "classnames";
// In standalone mode, @mat3ra/made exports the data class (not a React component).
// Render a simple read-only display of the material name as a fallback.
function MaterialNameFallback({ material }) {
    var _a, _b;
    const name = (_b = (_a = material === null || material === void 0 ? void 0 : material.name) !== null && _a !== void 0 ? _a : material === null || material === void 0 ? void 0 : material.formula) !== null && _b !== void 0 ? _b : "Material";
    return (_jsxs("div", { style: { padding: "16px" }, children: [_jsx("strong", { children: "Material:" }), " ", name] }));
}
function MaterialTab({ className, id, role, material, index, length, publicAccount, profile, addRemoveAllowed, onUpdateIndex, onMaterialRemove, openAddMaterialsDialog, MaterialViewerComponent, }) {
    return (_jsx("div", { className: setClass(className), id: id, role: role, style: { height: "100%" }, children: MaterialViewerComponent ? (_jsx(MaterialViewerComponent, { material: material, index: index, length: length, publicAccount: publicAccount, profile: profile, addRemoveAllowed: addRemoveAllowed, onUpdateIndex: onUpdateIndex, onRemove: onMaterialRemove, onAdd: openAddMaterialsDialog })) : (_jsx(MaterialNameFallback, { material: material, publicAccount: publicAccount, profile: profile, index: index, length: length, editable: false, addRemoveAllowed: addRemoveAllowed, onUpdateIndex: onUpdateIndex, showHeader: true, showMetadata: true, onRemove: onMaterialRemove, onAdd: openAddMaterialsDialog })) }));
}
export default MaterialTab;
