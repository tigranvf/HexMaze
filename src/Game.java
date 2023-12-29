import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.util.Random;

public class Game extends JPanel implements ActionListener, KeyListener, MouseListener {
    int width, height;
    int mazeRadius, mazeDiameter;
    int cx, cy;
    int tileSize, mainTileSize;
    boolean flatTop;
    double sqrt3, hsqrt3, tsqrt3;
    double horiz, vert;
    double[] xpoints, ypoints;

    Color bg = new Color(30, 30, 30);
    Color color = new Color(200, 200, 200);
    Color playerColor = new Color(100, 200, 100);

    public enum Hexagon {
        Null,
        False,
        True
    }

    double pq, pr;

    Frame frame;
    Hexagon[][] map;
    Random random;
    Timer gameLoop;

    public enum State {
        Menu,
        InGame
    }

    State state = State.InGame;

    Game(Frame frame, int width, int height, int mazeRadius) {
        this.width = width;
        this.height = height;
        this.cx = width/2;
        this.cy = height/2;
        this.mazeRadius = mazeRadius;
        this.mazeDiameter = mazeRadius * 2 + 1;

        sqrt3 = Math.sqrt(3);
        hsqrt3 = sqrt3 / 2;
        tsqrt3 = sqrt3 / 3;

        setPreferredSize(new Dimension(this.width, this.height));
        setBackground(bg);
        addKeyListener(this);
        addMouseListener(this);
        setFocusable(true);

        this.random = new Random();

        this.mainTileSize = 25;
        this.map = new Hexagon[mazeDiameter][mazeDiameter];
        for (int q = 0; q < mazeDiameter; q++) {
            for (int r = 0; r < mazeDiameter; r++) {
                if (Math.abs(-(q - mazeRadius)-(r - mazeRadius)) <= mazeRadius) {
                    map[q][r] = Hexagon.False;
                } else {
                    map[q][r] = Hexagon.Null;
                }
            }
        }

        calculatePoints(25, true);

        this.pq = 0;
        this.pr = 0;
        this.flatTop = true;
        this.frame = frame;

        gameLoop = new Timer(0, this);
        gameLoop.start();
    }

    double sin(double a) {
        return Math.sin(a / 180 * Math.PI);
    }

    double cos(double a) {
        return Math.cos(a / 180 * Math.PI);
    }

    void calculatePoints(int tileSize, boolean flatTop) {
        this.tileSize = tileSize;
        this.xpoints = new double[6];
        this.ypoints = new double[6];

        if (flatTop) {
            for (int i = 0; i < 6; i++) {
                this.xpoints[i] = sin(30 + i * 60) * tileSize;
                this.ypoints[i] = cos(30 + i * 60) * tileSize;
            }
        } else {
            for (int i = 0; i < 6; i++) {
                this.xpoints[i] = sin(     i * 60) * tileSize;
                this.ypoints[i] = cos(     i * 60) * tileSize;
            }
        }

        if (flatTop) {
            this.horiz = tileSize * 2;
            this.vert = sqrt3 * tileSize;
        }
        else {
            this.horiz = sqrt3 * tileSize;
            this.vert = tileSize * 2;
        }
    }

    Point hexToPixel(Point hex) {
        if (flatTop) {
            int x = (int) (tileSize * (   1.5 * hex.x                ));
            int y = (int) (tileSize * (hsqrt3 * hex.x + sqrt3 * hex.y));

            return new Point(x + cx, y + cy);
        } else {
            int x = (int) (tileSize * (sqrt3 * hex.x + hsqrt3 * hex.y));
            int y = (int) (tileSize * (  1.5 * hex.y                 ));

            return new Point(x + cx, y + cy);
        }
    }


    Point pixelToHex(Point point) {
        if (flatTop) {
            int q = (int) (( 2./3 * point.x                   ) / tileSize);
            int r = (int) ((-1./3 * point.x + tsqrt3 * point.y) / tileSize);
            return new Point(q, r);
        } else {
            int q = (int) ((tsqrt3 * point.x  - 1./3 * point.y) / tileSize);
            int r = (int) ((                    2./3 * point.y) / tileSize);
            return new Point(q, r);
        }
    }

    public void drawHexagon(Graphics g, int x, int y, boolean filled) {
        Polygon polygon = new Polygon();

        for (int i = 0; i < 6; i++) {
            polygon.addPoint((int) xpoints[i] + x, (int) (ypoints[i] + y));
        }

        if (filled) {
            g.fillPolygon(polygon);
        } else {
            g.drawPolygon(polygon);
        }
    }

    @Override
    public void paintComponent(Graphics g) {
        if (state == State.Menu) {
            g.setColor(playerColor);
            Point a = hexToPixel(new Point(0, 0));
            drawHexagon(g, a.x, a.y, false);

            g.setColor(color);
            Point b = hexToPixel(new Point(0, -2));
            drawHexagon(g, b.x, b.y, false);
        }
        if (state == State.InGame) {
            g.setColor(color);
            Point point;
            for (int q = 0; q < mazeDiameter; q++) {
                for (int r = 0; r < mazeDiameter; r++) {
                    if (map[q][r] != Hexagon.Null) {
                        point = hexToPixel(new Point(q - mazeRadius, r - mazeRadius));
                        // g.setColor(new Color(random.nextInt(16777216)));
                        drawHexagon(g, point.x, point.y, true);
                    }
                }
            }
            gameLoop.stop();
        }
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        repaint();
    }

    @Override
    public void keyTyped(KeyEvent e) {}

    @Override
    public void keyPressed(KeyEvent e) {}

    @Override
    public void keyReleased(KeyEvent e) {}

    @Override
    public void mouseClicked(MouseEvent e) {}

    @Override
    public void mousePressed(MouseEvent e) {}

    @Override
    public void mouseReleased(MouseEvent e) {}

    @Override
    public void mouseEntered(MouseEvent e) {}

    @Override
    public void mouseExited(MouseEvent e) {}
}
