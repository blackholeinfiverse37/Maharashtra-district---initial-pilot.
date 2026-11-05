// One card's safety net: if the card fails while it is drawn (for example on a field of an unexpected type from the
// backend), only that card is replaced by a short message and every other card keeps working. A new answer
// (`resetKey`, e.g. the page's data) gives the card another try.
import { Component } from "react";
import { useT } from "../i18n/LanguageContext";

function CardFailed() {
  const t = useT();
  return (
    <div className="card" role="status">
      <p className="card-text">{t("card.failed")}</p>
    </div>
  );
}

export default class CardBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("A card could not be shown:", error);
  }

  componentDidUpdate(previous) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    return this.state.failed ? <CardFailed /> : this.props.children;
  }
}
