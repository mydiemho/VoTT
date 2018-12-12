import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import { IApplicationState, IProject, IAsset, IAssetMetadata, AssetState } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { RouteComponentProps } from "react-router-dom";
import HtmlFileReader from "../../../../common/htmlFileReader";
import "./editorPage.scss";
import AssetPreview from "./assetPreview";
import EditorFooter from "./editorFooter";
import EditorSideBar from "./editorSideBar";

interface IEditorPageProps extends RouteComponentProps, React.Props<IEditorPageProps> {
    project: IProject;
    projectActions: IProjectActions;
}

interface IEditorPageState {
    project: IProject;
    assets: IAsset[];
    selectedAsset?: IAssetMetadata;
}

function mapStateToProps(state: IApplicationState) {
    return {
        project: state.currentProject,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        projectActions: bindActionCreators(projectActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class EditorPage extends React.Component<IEditorPageProps, IEditorPageState> {
    private loadingProjectAssets: boolean = false;

    constructor(props, context) {
        super(props, context);

        this.state = {
            project: this.props.project,
            assets: [],
        };

        const projectId = this.props.match.params["projectId"];
        if (!this.props.project && projectId) {
            this.props.projectActions.loadProject(projectId);
        }

        this.selectAsset = this.selectAsset.bind(this);
        this.onFooterChange = this.onFooterChange.bind(this);
    }

    public async componentDidMount() {
        if (this.props.project) {
            await this.loadProjectAssets();
        }
    }

    public async componentDidUpdate() {
        if (this.props.project && this.state.assets.length === 0) {
            await this.loadProjectAssets();
        }
    }

    public render() {
        const { project } = this.props;
        const { assets, selectedAsset } = this.state;

        if (!project) {
            return (<div>Loading...</div>);
        }

        return (
            <div className="editor-page">
                <div className="editor-page-sidebar bg-lighter-1">
                    <EditorSideBar
                        assets={assets}
                        selectedAsset={selectedAsset ? selectedAsset.asset : null}
                        onAssetSelected={this.selectAsset}
                    />
                </div>
                <div className="editor-page-content">
                    <div className="editor-page-content-header">
                        Header
                    </div>
                    <div className="editor-page-content-body">
                        {selectedAsset &&
                            <div className="canvas-container">
                                <AssetPreview asset={selectedAsset.asset} />
                                {selectedAsset.asset.size &&
                                    <div>
                                        Width: {selectedAsset.asset.size.width}
                                        Height: {selectedAsset.asset.size.height}
                                    </div>
                                }
                            </div>
                        }
                    </div>
                    <div>
                        <EditorFooter
                            tags={this.props.project.tags}
                            onTagsChanged={this.onFooterChange} />
                    </div>
                </div>
            </div>
        );
    }

    private onFooterChange(footerState) {
        this.setState({
            project: {
                ...this.state.project,
                tags: footerState.tags,
            },
        });
    }

    private async selectAsset(asset: IAsset) {
        const assetMetadata = await this.props.projectActions.loadAssetMetadata(this.props.project, asset);
        if (assetMetadata.asset.state === AssetState.NotVisited) {
            assetMetadata.asset.state = AssetState.Visited;
        }

        try {
            if (!assetMetadata.asset.size) {
                const assetProps = await HtmlFileReader.readAssetAttributes(asset);
                assetMetadata.asset.size = { width: assetProps.width, height: assetProps.height };
            }
        } catch (err) {
            console.error(err);
        }

        await this.props.projectActions.saveAssetMetadata(this.props.project, assetMetadata);
        await this.props.projectActions.saveProject(this.props.project);

        this.setState({
            selectedAsset: assetMetadata,
            assets: _.values(this.props.project.assets),
        });
    }

    private async loadProjectAssets() {
        if (this.loadingProjectAssets || this.state.assets.length > 0) {
            return;
        }

        this.loadingProjectAssets = true;

        await this.props.projectActions.loadAssets(this.props.project);
        const assets = _.values(this.props.project.assets);

        this.setState({
            assets,
        }, async () => {
            if (assets.length > 0) {
                await this.selectAsset(assets[0]);
            }
            this.loadingProjectAssets = false;
        });
    }
}
