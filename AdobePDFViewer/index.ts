import {IInputs, IOutputs} from "./generated/ManifestTypes";

declare var AdobeDC: any;

export class AdobPDFViewer implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _container: HTMLDivElement;
    private _context: ComponentFramework.Context<IInputs>;
    private _adobeDC : any;
    private _adobeViewer : any;
    private _isInitialized: boolean = false;

    private _clientId: string = "";
    private _pdfURL: string = "";
    private _filenName: string = "";

    constructor()
    {
    }

    public init(context: ComponentFramework.Context<IInputs>, 
                notifyOutputChanged: () => void, 
                state: ComponentFramework.Dictionary, 
                container:HTMLDivElement): void
    {
        // Add control initialization code
        this._container = container;
        this._context = context;

        // track resize changes
        this._context.mode.trackContainerResize(true);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void
    {
        if(this._isInitialized) {
            //update the container size
            let div = document.getElementById("adobe-dc-view");

            if(div) 
            {
                if(div?.style.width !== `${context.mode.allocatedWidth}px` || div?.style.height !== `${context.mode.allocatedHeight}px`)
                {
                    div.style.width = `${context.mode.allocatedWidth}px`;
                    div.style.height = `${context.mode.allocatedHeight}px`;
                }
            }

            // create a new container if the clientId or pdfURL has changed
            if(this._clientId !== this._context.parameters.clientId.raw || this._pdfURL !== this._context.parameters.pdfURL.raw) {
                this._clientId = this._context.parameters.clientId.raw || "";
                this._pdfURL = this._context.parameters.pdfURL.raw || "";
                this._adobeDC = new AdobeDC.View({ clientId: this._context.parameters.clientId.raw || "" });
                this.previewFile(this._adobeDC, this._context.parameters.pdfURL.raw || "", this._context.parameters.pdfURL.raw || "");
                return;
            }
            return;
        }

        let div = document.createElement("div");
        div.id = "adobe-dc-view";
        div.style.width = `${context.mode.allocatedWidth}px`;
        div.style.height = `${context.mode.allocatedHeight}px`;
        this._container.appendChild(div);

        let adobeScript = document.createElement("script");
        adobeScript.src = "https://acrobatservices.adobe.com/view-sdk/viewer.js";
        adobeScript.type = "text/javascript";
        document.body.appendChild(adobeScript);
        
        document.addEventListener("adobe_dc_view_sdk.ready", () => {
            this.initialiseViewer();    
        });
        
        adobeScript.onerror = () => {
            console.error("Failed to load Adobe Document Services");
        }

        this._isInitialized = true;
    }

    public getOutputs(): IOutputs
    {
        return {};
    }

    public destroy(): void
    {
        // Add code to cleanup control if necessary
    }

    //------------------------------------------------------------------------------------------------
    // Private methods
    //------------------------------------------------------------------------------------------------

    private initialiseViewer(): void {
        this._clientId = this._context.parameters.clientId.raw || "";
        this._pdfURL = this._context.parameters.pdfURL.raw || "";
        this._adobeDC = new AdobeDC.View({ clientId: this._context.parameters.clientId.raw || "" });

        this.previewFile(this._adobeDC, this._context.parameters.pdfURL.raw || "", this._context.parameters.pdfURL.raw || "");
    }

    private previewFile(adobeViewer: any, url: string, fileName: string) {
        let previewFilePromise = adobeViewer.previewFile(
            {
                content: 
                {
                    location:{ url: this._context.parameters.pdfURL.raw || "" }
                },
                metaData:
                { 
                    fileName: this._context.parameters.pdfURL.raw || "" 
                }
            }, 
            {
                embedMode: "FULL_WINDOW",
                showAnnotationTools: true
            }
        );
        previewFilePromise.then((adobeViewer: any) => {
            this._adobeViewer = adobeViewer;
        }).catch((error: any) => {
            console.error(error);
        });
    }
}