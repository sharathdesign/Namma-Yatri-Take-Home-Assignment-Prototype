# Moving tech — final prototype

Open `index.html` in a browser. The entire prototype, including the exact Figma images, SVG assets, and Geist variable font, is embedded in that one file. No server, installation, internet connection, or build step is needed to explore it. Google Maps links open externally when clicked.

## Flow

1. Open the invitation from Your trips.
2. Choose Mysuru or Kushalnagar; review the route and your estimated share.
3. Accept the estimate and fixed stay contribution, then request to join.
4. The request-sent screen stays visible for eight seconds before switching to Ananya’s organiser view. The preview controls beside the phone (below it on narrow screens) show the countdown and a Continue as Ananya link. Returning from the organiser view opens Riya’s sent request with this link available; the automatic handoff does not repeat. Opening a sheet, leaving this screen, or hiding the browser tab pauses the handoff.
5. Ananya must explicitly confirm the seat to reach Riya’s final confirmation screen. The timer only switches views; it never approves a request.

Cancel and decline each have a confirmation sheet, an outcome screen, and a retry path. Decline reasons carry through to Riya’s view. Retrying requires fresh consent. Changing the pickup clears earlier consent and updates every cost and time.

Inbox, Account, Notifications, and Message group use the same explanatory empty-state pattern with a secondary Return to trips button. The trip menu contains only Who’s going and Full route. The travel-group row also opens Who’s going.

Reset prototype, outside the phone, clears the complete journey and pending handoff. Reloading the file also starts fresh.

## Design and dimensions

- Logical mobile viewport: exactly 390 × 844 CSS pixels, inside a dark iPhone-style frame. Smaller browser widths scale the complete frame without changing its internal dimensions.
- The organiser design is taller than the requested viewport. Its content scrolls while the header and approval controls stay visible.
- The updated status component uses the current 48 px amber/green circular indicators and exact 24 px Figma icons. Its layer documentation says 56 px; the actual current component geometry is 48 px.
- Figma’s organiser member values add up to ₹12,940, although its total says ₹12,700. This prototype preserves the member values and uses the reconciled total, labelled Estimated group total. Selecting Kushalnagar recalculates the split consistently.
- Keyboard support includes visible focus, modal focus trapping, Escape to close, radio selection, and native checkbox controls. Sheets also dismiss by clicking the backdrop or dragging the handle down. Reduced-motion preferences are respected.

## Figma references

File: `UVjohYSW5KdjuLYnytyTgj`

- Your trips: `58036:6466`
- Invitation and pickup selection: `58062:3463`
- Route sheet: `58062:3561`
- Review share: `58081:4186`
- Cost split sheet: `58088:1754`
- Request sent: `58090:4616`
- Organiser request: `58090:4861`
- Final confirmation: `58111:5213`
- Travel group: `58036:6501`
- Updated status component: `58095:1784`

## Source and validation

`src/` contains editable HTML, CSS, JavaScript, and the build script. Existing Moving-Tech-App patterns supplied the local font, supplemental icons, modal behavior, and route-cost model; layout and design assets follow the supplied Figma frames.

To rebuild after editing:

```sh
python3 src/build.py
```

`verification/` contains browser screenshots and the validation report. The automated browser check covers both pickups, consent resets, route and split sheets, map destinations, modal keyboard behavior, timed handoff and pause behavior, explicit organiser approval, cancel/decline/retry, reset during pending handoff, image loading, original SVG dimensions, offline operation, and small-screen scaling.

The check uses Playwright and the Chrome installation already available on this workstation:

```sh
node src/verify.cjs
```
