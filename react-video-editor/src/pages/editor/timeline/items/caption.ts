import { Caption as CaptionBase, CaptionsProps } from "@designcombo/timeline";

class Caption extends CaptionBase {
  static type = "Caption";
  constructor(props: CaptionsProps) {
    super(props);
    this.fill = "#303030";
  }

  public _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.drawTextIdentity(ctx);
    this.updateSelected(ctx);
  }

  public drawTextIdentity(ctx: CanvasRenderingContext2D) {
    const textPath = new Path2D(
      "M4 4.8C3.55817 4.8 3.2 5.15817 3.2 5.6C3.2 6.04183 3.55817 6.4 4 6.4H5.6C6.04183 6.4 6.4 6.04183 6.4 5.6C6.4 5.15817 6.04183 4.8 5.6 4.8H4Z M8.8 4.8C8.35817 4.8 8 5.15817 8 5.6C8 6.04183 8.35817 6.4 8.8 6.4H12C12.4418 6.4 12.8 6.04183 12.8 5.6C12.8 5.15817 12.4418 4.8 12 4.8H8.8Z M4 8C3.55817 8 3.2 8.35817 3.2 8.8C3.2 9.24183 3.55817 9.6 4 9.6H7.2C7.64183 9.6 8 9.24183 8 8.8C8 8.35817 7.64183 8 7.2 8H4Z M10.4 8C9.95817 8 9.6 8.35817 9.6 8.8C9.6 9.24183 9.95817 9.6 10.4 9.6H12C12.4418 9.6 12.8 9.24183 12.8 8.8C12.8 8.35817 12.4418 8 12 8H10.4Z M2.4 0C1.07452 0 0 1.07452 0 2.4V10.4C0 11.7255 1.07452 12.8 2.4 12.8H13.6C14.9255 12.8 16 11.7255 16 10.4V2.4C16 1.07452 14.9255 0 13.6 0H2.4ZM1.6 2.4C1.6 1.95817 1.95817 1.6 2.4 1.6H13.6C14.0418 1.6 14.4 1.95817 14.4 2.4V10.4C14.4 10.8418 14.0418 11.2 13.6 11.2H2.4C1.95817 11.2 1.6 10.8418 1.6 10.4V2.4Z",
    );
    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);
    ctx.translate(0, 12);
    ctx.font = "600 12px 'Geist variable'";
    ctx.fillStyle = "#f4f4f5";
    ctx.textAlign = "left";
    ctx.clip();
    ctx.fillText(this.text, 36, 12);

    ctx.translate(8, 1);

    ctx.fillStyle = "#f4f4f5";
    ctx.fill(textPath);
    ctx.restore();
  }
}

export default Caption;
