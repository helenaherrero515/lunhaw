"""EQ-005 Green Index scoring and uncertainty (pure functions, no I/O).

Score = 0.60 * Cs + 0.20 * Os + 0.20 * Us, where (all in percent of the unit's land area):
  Cs = min(100, 100 * T / 30)          tree canopy against the 3-30-300 rule's 30% target
  Os = min(100, 100 * (G + W) / 30)    other vegetation plus water, against the same target
  Us = 100 - S                         unsealed ground
The weights are a Lunhaw convention (canopy weighted most because tree shade is the best-evidenced
driver of cooling and perceived greenness); docs/methods.md and the research report explain why.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

WEIGHTS = (0.60, 0.20, 0.20)
TARGET_PCT = 30.0
BANDS = ((70.0, "High"), (40.0, "Moderate"), (0.0, "Low"))


@dataclass(frozen=True)
class Fractions:
    """Mutually exclusive cover shares in percent (tree, other vegetation, water, sealed, bare)."""

    tree: float
    other_veg: float
    water: float
    sealed: float
    bare: float

    def total(self) -> float:
        return self.tree + self.other_veg + self.water + self.sealed + self.bare


def sub_scores(f: Fractions, target: float = TARGET_PCT) -> tuple[float, float, float]:
    cs = min(100.0, 100.0 * f.tree / target)
    os_ = min(100.0, 100.0 * (f.other_veg + f.water) / target)
    us = max(0.0, 100.0 - f.sealed)
    return cs, os_, us


def score(f: Fractions, weights: tuple[float, float, float] = WEIGHTS, target: float = TARGET_PCT) -> float:
    cs, os_, us = sub_scores(f, target)
    return weights[0] * cs + weights[1] * os_ + weights[2] * us


def display_value(s: float) -> int:
    """Scores are shown rounded to the nearest 5 to avoid false precision."""
    return int(5 * round(s / 5))


def band(s: float) -> str:
    """Band of the displayed (rounded) value, so the number and its band always agree."""
    v = display_value(s)
    return next(name for floor, name in BANDS if v >= floor)


@dataclass(frozen=True)
class Uncertainty:
    p05: float
    p95: float
    band_flip_rate: float
    borderline: bool


def monte_carlo(
    variants: list[Fractions],
    base: Fractions,
    n_eff: float = 50.0,
    draws: int = 5000,
    seed: int = 5,
    flip_threshold: float = 0.20,
) -> Uncertainty:
    """Robustness of the score to input error and to the method's conventions (OECD/JRC practice).

    Each draw picks one parameter variant (e.g. canopy height threshold 2 m vs 5 m, NDVI cut 0.25/0.30/0.35),
    perturbs each fraction with a Beta distribution whose effective sample size is `n_eff` (a wide prior until
    a photo-check supplies a real n), draws weights from a Dirichlet centred on 0.6/0.2/0.2, and a canopy
    target between 25% and 35%. The seed is fixed so runs are reproducible.
    """
    rng = np.random.default_rng(seed)
    base_band = band(score(base))
    out = np.empty(draws)
    flips = 0
    for i in range(draws):
        v = variants[rng.integers(len(variants))]

        def jitter(pct: float) -> float:
            p = min(max(pct / 100.0, 1e-4), 1 - 1e-4)
            return 100.0 * rng.beta(p * n_eff, (1 - p) * n_eff)

        f = Fractions(jitter(v.tree), jitter(v.other_veg), jitter(v.water), jitter(v.sealed), v.bare)
        w = tuple(rng.dirichlet(np.array(WEIGHTS) * 100.0))
        t = rng.uniform(25.0, 35.0)
        s = min(100.0, max(0.0, score(f, w, t)))  # type: ignore[arg-type]
        out[i] = s
        flips += band(s) != base_band
    rate = flips / draws
    return Uncertainty(float(np.percentile(out, 5)), float(np.percentile(out, 95)), rate, rate > flip_threshold)
