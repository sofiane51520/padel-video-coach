import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/constants/theme";

type CourtPreviewProps = {
  compact?: boolean;
};

export function CourtPreview({ compact = false }: CourtPreviewProps) {
  return (
    <View style={[styles.court, compact && styles.compactCourt]}>
      <View style={styles.net} />
      <View style={[styles.serviceLine, styles.topService]} />
      <View style={[styles.serviceLine, styles.bottomService]} />
      <View style={styles.centerLine} />
      <View style={[styles.corner, styles.topLeft]}>
        <Text style={styles.cornerLabel}>1</Text>
      </View>
      <View style={[styles.corner, styles.topRight]}>
        <Text style={styles.cornerLabel}>2</Text>
      </View>
      <View style={[styles.corner, styles.bottomRight]}>
        <Text style={styles.cornerLabel}>3</Text>
      </View>
      <View style={[styles.corner, styles.bottomLeft]}>
        <Text style={styles.cornerLabel}>4</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  court: {
    width: "100%",
    aspectRatio: 1.78,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.court,
    overflow: "hidden"
  },
  compactCourt: {
    maxHeight: 230
  },
  net: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 3,
    backgroundColor: colors.surface
  },
  serviceLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.surface
  },
  topService: {
    top: "35%"
  },
  bottomService: {
    top: "65%"
  },
  centerLine: {
    position: "absolute",
    top: "35%",
    bottom: "35%",
    left: "50%",
    width: 2,
    backgroundColor: colors.surface
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center"
  },
  topLeft: {
    left: spacing.md,
    top: spacing.md
  },
  topRight: {
    right: spacing.md,
    top: spacing.md
  },
  bottomRight: {
    right: spacing.md,
    bottom: spacing.md
  },
  bottomLeft: {
    left: spacing.md,
    bottom: spacing.md
  },
  cornerLabel: {
    color: colors.ink,
    fontWeight: "900"
  }
});
