import javax.swing.*;
import java.awt.*;
import java.util.ArrayList;

// Press Shift twice to open the Search Everywhere dialog and type `show whitespaces`,
// then press Enter. You can now see whitespace characters in your code.
public class Main {
    public static void main(String[] args) {
        int mazeRadius = 10;
        int width = 750;
        int height = 750;

        JFrame frame = new JFrame("Maze");
        frame.setVisible(true);
        frame.setSize(width, height);
        frame.setLocationRelativeTo(null);
        frame.setResizable(false);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

        Game game = new Game(frame, width, height, mazeRadius);
        frame.add(game);
        frame.pack();
        frame.setBackground(new Color(30, 30, 30));
        game.requestFocus();
    }
}