import { App, Editor, MarkdownPostProcessorContext, MarkdownView, parseFrontMatterTags, Plugin, getAllTags, View, TFile, WorkspaceLeaf, TextFileView } from 'obsidian';

export default class TagStylesPlugin extends Plugin {

	appliedClasses = new WeakMap<MarkdownView, string[]>();

	async onload() {
		// Processor that adds CSS class to a DIV with a tag in it
		this.registerMarkdownPostProcessor(this.applyClass);

		// Processor that replaces <img> with <svg> when applicable
		this.registerMarkdownPostProcessor((node, ctx) => {
			const nodeEl = node as HTMLElement;
			
			nodeEl.findAll("p").forEach((pEl) => {
				pEl.findAll("span").forEach(async (spanEl) => {
					if (spanEl.hasAttribute("src") && spanEl?.getAttr("src")?.contains(".svg")) {	
						const file = this.app.vault.getFiles().find((element) => element.name == spanEl.getAttr("src"));
            if (!file)
              return;
						const content = await this.app.vault.cachedRead(file);
						
						const el = createEl("div");
						el.innerHTML = content;
						el.addClass("svg-div-embed");

						if (spanEl.hasAttribute("alt")) {
							pEl.parentElement?.setAttr("alt", spanEl.getAttr("alt"));
						}

						pEl.parentElement?.addClass("svg-container");
						pEl.appendChild(el);
						pEl.addClass("svg-p-embed");
						pEl.removeChild(spanEl);
					}
				});
			});

		});

		// Handler that adds CSS class to an entire page based on its tags
		this.registerEvent(this.app.workspace.on('layout-change', this.handleLayoutChange.bind(this)));

		this.registerMarkdownPostProcessor((element, context) => {

		});
	}	

	onunload() { }

	/**
	 * Applies a CSS class to all tag elements in a markdown view. 
	 */
	applyClass(node: Node, ctx: MarkdownPostProcessorContext) {
		const nodeEl = node as HTMLElement;
		
		// Apply a CSS class to all DIVs containing a tag
		nodeEl.findAll("a.tag").forEach((tagEl) => {
			const tag = (tagEl as HTMLAnchorElement).innerText
        		.slice(1)
        		.replace("/", "-");
			nodeEl.addClass(`tag-${tag}`);
		});	
	}
	

	/**
	 * On opening a file, apply a CSS class to it based on its tags and top-level folder.
	 * Removes all the added classes when the file is closed.
	 */
	private handleLayoutChange() {
		// Stop if there are no active views
		const activeViews = this.getAllActiveViews();
		if (!activeViews) {
			return;
		}

		// Iterate each open markdown view
		activeViews.forEach((view) => {
			this.removePreviousClasses(view);
			let container: Element | null;

			// Make list of CSS classes to add
			var classes: string[] = [];

			// Add class for each tag
      if (!view.file)
        return;
			const fileCache = this.app.metadataCache.getFileCache(view.file);
      if (!fileCache)
        return;
			const fileTags = getAllTags(fileCache);
      if (!fileTags)
        return;
			fileTags.forEach(function (element) {
				classes.push("tag-"+element.replace("#",""))
			});

			// Add class for this file's current folder, if any
			const filePath = view.file.path;
			if (filePath.contains("/")) {
				classes.push("tag-"+filePath.replace(" ", "").split("/")[0]);
			}

			if (this.isReadMode(view)) {
				container = this.getPreviewContainer(view);
			}
			else if (this.isEditMode(view)) {
				container = this.getEditContainer(view);
			} else {
        container = null;
      }

      if (!container)
        return;

			this.applyClasses(classes, view, container);
		})
	}

	/**
     * Get the active markdown view and any linked panes.
     */
	 private getAllActiveViews(): MarkdownView[] | null {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView) {
		  // Get any linked views
		  let activeViews: MarkdownView[] = [activeView];
		  const leafGroup = this.app.workspace.getGroupLeaves((activeView.leaf as any).group);
		  if (leafGroup && leafGroup.length > 0) {
			activeViews = leafGroup
			  .map((leaf) => leaf.view)
			  .filter((view) => view instanceof MarkdownView) as MarkdownView[];
		  }
		  return activeViews;
		}
		return null;
	}

	/**
     * Given a view, remove any extra classes this plugin
     * has applied to that view.
     */
	private removePreviousClasses(view: MarkdownView): void {
		const previewContainer = this.getPreviewContainer(view);
		const editContainer = this.getEditContainer(view);
		const classes = this.appliedClasses.get(view);
		if (classes && previewContainer) {
		  previewContainer.removeClasses(classes);
		}
		if (classes && editContainer) {
		  editContainer.removeClasses(classes);
		}
		this.appliedClasses.delete(view);
	}

	/**
     * Get the element that preview classes are applied to
     */
	private getPreviewContainer(view: MarkdownView) {
		return view.contentEl.querySelector('.markdown-preview-view');
	}
	
	/**
	 * Get the element that edit/source classes are applied to
	 */
	private getEditContainer(view: MarkdownView) {
		return view.contentEl.querySelector('.markdown-source-view');
	}

	/**
     * Get the inline title element
     */
	private getTitleElement(view: MarkdownView) {
		return view.contentEl.querySelector('.inline-title');
	}


	/**
    * Returns true if a view is in preview mode
    */
	private isReadMode(view: MarkdownView): boolean {
		return view.getMode() === 'preview';
	}
	
	/**
	 * Returns true if a view is in edit/source mode
	 */
	private isEditMode(view: MarkdownView): boolean {
		return view.getMode() === 'source';
	}

	/**
     * Add classes to an html element and store the
     * applied classes along with a reference the view
     * they were added to for removal later.
     */
	private applyClasses(classes: string[], view: MarkdownView, container: Element): void {
		container.addClasses(classes);
		this.appliedClasses.set(view, classes);
	}
}