import React from "react";

export function Ticker() {
  return (
    <div className="ticker" aria-label="What Lunhaw helps you do">
      <div className="track" id="track">
        <ul>
          <li>Find your green space</li>
          <li>Discover a place to pause</li>
          <li>Find your way there</li>
        </ul>
        <ul aria-hidden="true">
          <li>Find your green space</li>
          <li>Discover a place to pause</li>
          <li>Find your way there</li>
        </ul>
      </div>
    </div>
  );
}
